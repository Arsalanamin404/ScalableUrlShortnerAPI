import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { JobScheduler, Queue } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../../common/redis/redis.service.js';
import { CLEANUP_EXPIRED_URL_JOB, CLEANUP_QUEUE } from './cleanup.constants.js';

@Injectable()
export class CleanupProducer implements OnModuleInit, OnModuleDestroy {
  private cleanupQueue: Queue;
  private scheduler: JobScheduler;

  constructor(
    private readonly redis: RedisService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CleanupProducer.name);
  }

  async onModuleInit() {
    const connection = this.redis.getBullClient();

    this.cleanupQueue = new Queue(CLEANUP_QUEUE, {
      connection,
    });

    this.scheduler = new JobScheduler(CLEANUP_QUEUE, { connection });

    await this.scheduler.waitUntilReady();
    await this.cleanupQueue.add(
      CLEANUP_EXPIRED_URL_JOB,
      {},
      {
        jobId: CLEANUP_EXPIRED_URL_JOB,
        repeat: { every: 60 * 60 * 1000 },
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.info('Cleanup producer initialized');
    this.logger.info('Scheduled cleanup job every 1 hour');
  }

  async onModuleDestroy() {
    await this.cleanupQueue?.close();
    await this.scheduler?.close();
    this.logger.info('Cleanup producer queue closed');
  }
}
