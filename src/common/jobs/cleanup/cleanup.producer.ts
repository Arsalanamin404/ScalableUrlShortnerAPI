import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import { InjectQueue } from '@nestjs/bullmq';
import { CLEANUP_JOBS, CLEANUP_QUEUE } from './cleanup.constants.js';

@Injectable()
export class CleanupProducer implements OnModuleInit {
  constructor(
    @InjectQueue(CLEANUP_QUEUE)
    private readonly cleanupQueue: Queue,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CleanupProducer.name);
  }

  async onModuleInit() {
    await this.cleanupQueue.add(
      CLEANUP_JOBS.DELETE_EXPIRED_URLS,
      {},
      {
        jobId: CLEANUP_JOBS.DELETE_EXPIRED_URLS,
        repeat: { every: 60 * 60 * 1000 },
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.info('Cleanup job scheduled every 1 hour');
  }
}
