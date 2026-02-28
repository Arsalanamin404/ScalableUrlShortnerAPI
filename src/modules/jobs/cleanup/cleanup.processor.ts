import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../../common/redis/redis.service.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CLEANUP_EXPIRED_URL_JOB, CLEANUP_QUEUE } from './cleanup.constants.js';
import { Worker } from 'bullmq';

@Injectable()
export class CleanupProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly BATCH_SIZE = 50;
  private worker: Worker;

  constructor(
    private readonly logger: PinoLogger,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.setContext(CleanupProcessor.name);
  }

  onModuleInit() {
    const connection = this.redis.getBullClient();
    this.worker = new Worker(
      CLEANUP_QUEUE,
      async (job) => {
        switch (job.name) {
          case CLEANUP_EXPIRED_URL_JOB:
            this.logger.info(`Processing Job: ${job.name}`);
            await this.handleExpiredUrlCleanup();
            break;

          case 'test-job':
            console.log('test-job');
            break;
        }
      },
      {
        connection,
        concurrency: 5, // jobs this worker can process at the same time or in parallel
      },
    );
    this.worker.on('completed', (job) => {
      this.logger.info(`Job completed: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job failed: ${job?.id}`, err);
    });

    this.logger.info('Cleanup processor started');
  }

  async onModuleDestroy() {
    await this.worker?.close();
    this.logger.info('Cleanup processor stopped');
  }

  private async handleExpiredUrlCleanup() {
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

      if (redisKeys.length) {
        await this.redis.del(redisKeys);
      }

      await this.prisma.url.deleteMany({
        where: { id: { in: ids } },
      });

      this.logger.info(`Cleaned ${ids.length} expired URLs`);
    }
  }
}
