import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UrlRepository } from './repositories/url.repository.js';
import { nanoid } from 'nanoid';
import { Prisma } from '../../../generated/prisma/client.js';
import { RedisService } from '../../common/redis/redis.service.js';
import { PinoLogger } from 'nestjs-pino';
import { AnalyticsProducer } from '../../common/jobs/analytics/analytics.producer.js';
import { PrismaService } from '../../prisma/prisma.service.js';

type Url = Awaited<ReturnType<UrlRepository['create']>>;

@Injectable()
export class UrlService {
  constructor(
    private readonly repo: UrlRepository,
    private readonly redis: RedisService,
    private readonly logger: PinoLogger,
    private readonly analyticsProducer: AnalyticsProducer,
    private readonly prisma: PrismaService,
  ) {
    this.logger.setContext(UrlService.name);
  }

  async create(longUrl: string, expiresAt?: Date) {
    this.logger.info({ longUrl, expiresAt }, 'Creating short URL');

    const expiryDate = expiresAt ? new Date(expiresAt) : undefined;

    if (expiryDate && expiryDate < new Date()) {
      this.logger.warn({ expiresAt }, 'Invalid expiry date');
      throw new BadRequestException('Expiry must be in future only');
    }

    let created: Url | null = null;

    // Retry logic for NanoID collisions
    for (let attempt = 0; attempt < 5; attempt++) {
      const shortCode = nanoid(7);

      try {
        created = await this.prisma.$transaction(async (tx) => {
          // Prisma will automatically do two inserts:
          // one to insert the URL
          // another to Insert UrlStats (linked automatically)
          const url = await tx.url.create({
            data: {
              longUrl,
              shortCode,
              expiresAt: expiryDate,
              urlStats: {
                create: {},
              },
            },
          });

          return url;
        });
        this.logger.info({ shortCode }, 'Short URL created');
        break;
      } catch (err: unknown) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          this.logger.warn({ attempt, shortCode }, 'NanoID collision');
          continue;
        }
        this.logger.error({ err }, 'Error creating short URL');
        throw err;
      }
    }
    if (!created) {
      this.logger.error('Failed to generate unique short code');
      throw new Error('Failed to generate unique short code');
    }
    return created;
  }

  async redirect(shortCode: string, ip?: string, userAgent?: string) {
    const key = `short:${shortCode}`;

    this.logger.info({ shortCode }, 'Resolving short URL');

    const cached = await this.redis.get<string>(key);
    if (cached) {
      this.logger.info({ shortCode }, 'Cache hit');
      const data = JSON.parse(cached);

      this.analyticsProducer
        .trackClick({
          urlId: data.id,
          ip,
          userAgent,
        })
        .catch((err: unknown) =>
          this.logger.error({ err }, 'Failed to enqueue analytics job'),
        );

      return data.longUrl;
    }

    this.logger.info({ shortCode }, 'Cache miss, querying DB');

    const record = await this.repo.findByShortCode(shortCode);
    if (!record) {
      this.logger.warn({ shortCode }, 'URL not found');
      throw new NotFoundException('URL not found');
    }

    if (record.expiresAt && record.expiresAt < new Date()) {
      this.logger.warn({ shortCode }, 'URL expired');
      throw new NotFoundException('URL expired');
    }

    const ttl = record.expiresAt
      ? Math.max(
          1,
          Math.floor((record.expiresAt.getTime() - Date.now()) / 1000),
        )
      : undefined;

    const cacheValue = JSON.stringify({
      id: record.id,
      longUrl: record.longUrl,
    });

    await this.redis.set(key, cacheValue, ttl);

    this.logger.info({ shortCode, ttl }, 'Cached URL in Redis');

    this.analyticsProducer
      .trackClick({
        urlId: record.id,
        ip,
        userAgent,
      })
      .catch((err: unknown) =>
        this.logger.error({ err }, 'Failed to enqueue analytics job'),
      );

    return record.longUrl;
  }
}
