import { Module } from '@nestjs/common';
import { CleanupProcessor } from './cleanup.processor.js';
import { CleanupProducer } from './cleanup.producer.js';

@Module({
    providers: [CleanupProcessor, CleanupProducer],
})
export class JobsModule { }
