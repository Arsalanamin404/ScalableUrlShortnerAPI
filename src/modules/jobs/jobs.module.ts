import { Module } from '@nestjs/common';
import { CleanupProcessor } from './cleanup/cleanup.processor.js';
import { CleanupProducer } from './cleanup/cleanup.producer.js';

@Module({
    providers: [CleanupProcessor, CleanupProducer],
})
export class JobsModule {}
