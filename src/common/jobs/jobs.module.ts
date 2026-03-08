import { Global, Module } from '@nestjs/common';
import { CleanupProcessor } from './cleanup/cleanup.processor.js';
import { CleanupProducer } from './cleanup/cleanup.producer.js';
import { BullModule } from '@nestjs/bullmq';
import { CLEANUP_QUEUE } from './cleanup/cleanup.constants.js';
import { ANALYTICS_QUEUE } from './analytics/analytics.constant.js';
import { AnalyticsProcessor } from './analytics/analytics.processor.js';
import { AnalyticsProducer } from './analytics/analytics.producer.js';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: CLEANUP_QUEUE,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    }),
    BullModule.registerQueue({
      name: ANALYTICS_QUEUE,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    }),
  ],

  providers: [
    CleanupProcessor,
    CleanupProducer,
    AnalyticsProcessor,
    AnalyticsProducer,
  ],
  exports: [CleanupProducer, AnalyticsProducer],
})
export class JobsModule {}
