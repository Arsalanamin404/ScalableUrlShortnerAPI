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

type Url = Awaited<ReturnType<UrlRepository['create']>>;

@Injectable()
export class UrlService {
  constructor(
    private readonly repo: UrlRepository,
    private readonly redis: RedisService,
    private readonly logger: PinoLogger,
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
        created = await this.repo.create({
          longUrl,
          shortCode,
          expiresAt: expiryDate,
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

  async resolve(shortCode: string) {
    const key = `short:${shortCode}`;

    this.logger.info({ shortCode }, 'Resolving short URL');

    const cached = await this.redis.get<string>(key);
    if (cached) {
      this.logger.info({ shortCode }, 'Cache hit');
      return cached;
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

    await this.redis.set(key, record.longUrl, ttl);
    this.logger.info({ shortCode, ttl }, 'Cached URL in Redis');

    return record.longUrl;
  }
}
