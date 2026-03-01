import { Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../../common/redis/redis.service.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CLEANUP_JOBS, CLEANUP_QUEUE } from './cleanup.constants.js';

@Processor(CLEANUP_QUEUE)
@Injectable()
export class CleanupProcessor extends WorkerHost {
  private readonly BATCH_SIZE = 50;

  constructor(
    private readonly logger: PinoLogger,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {
    super();
    this.logger.setContext(CleanupProcessor.name);
  }

  async process(job: Job) {
    switch (job.name) {
      case CLEANUP_JOBS.DELETE_EXPIRED_URLS:
        this.logger.info(`Processing Job: ${job.name}`);
        await this.handleExpiredUrlCleanup();
        break;

      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  private async handleExpiredUrlCleanup() {
    let totalDeleted = 0;

    while (true) {
      const now = new Date();

      const expiredBatch = await this.prisma.url.findMany({
        where: { expiresAt: { lt: now } },
        select: { id: true, shortCode: true },
        orderBy: { expiresAt: 'asc' },
        take: this.BATCH_SIZE,
      });

      if (expiredBatch.length === 0) break;

      const ids = expiredBatch.map((u) => u.id);
      const redisKeys = expiredBatch.map((u) => `short:${u.shortCode}`);

      await Promise.all([
        redisKeys.length ? this.redis.del(redisKeys) : Promise.resolve(),
        this.prisma.url.deleteMany({
          where: { id: { in: ids } },
        }),
      ]);

      totalDeleted += ids.length;

      this.logger.info(`Cleaned batch of ${ids.length}`);
    }

    this.logger.info(`Total cleaned URLs: ${totalDeleted}`);
  }
}
