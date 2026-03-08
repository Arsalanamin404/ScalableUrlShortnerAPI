import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { TrackClickPayload } from './analytics.interface.js';
import { ANALYTICS_JOBS, ANALYTICS_QUEUE } from './analytics.constant.js';
import { PinoLogger } from 'nestjs-pino';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AnalyticsProducer {
  constructor(
    @InjectQueue(ANALYTICS_QUEUE)
    private readonly queue: Queue,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AnalyticsProducer.name);
  }

  async trackClick(payload: TrackClickPayload) {
    try {
      this.logger.info(
        { urlId: payload.urlId },
        'Adding analytics click job to queue',
      );

      const job = await this.queue.add(ANALYTICS_JOBS.TRACK_CLICK, payload, {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3500,
        },
      });

      this.logger.info(
        { jobId: job.id, urlId: payload.urlId },
        'Analytics job added successfully',
      );
    } catch (error: unknown) {
      this.logger.error(
        {
          err: error,
          payload,
        },
        'Failed to enqueue analytics job',
      );
      throw error;
    }
  }
}
