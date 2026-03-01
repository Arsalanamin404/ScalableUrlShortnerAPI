import { Global, Module } from '@nestjs/common';
import { CleanupProcessor } from './cleanup/cleanup.processor.js';
import { CleanupProducer } from './cleanup/cleanup.producer.js';
import { BullModule } from '@nestjs/bullmq';
import { CLEANUP_QUEUE } from './cleanup/cleanup.constants.js';

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
  ],

  providers: [CleanupProcessor, CleanupProducer],
  exports: [CleanupProducer],
})
export class JobsModule {}
