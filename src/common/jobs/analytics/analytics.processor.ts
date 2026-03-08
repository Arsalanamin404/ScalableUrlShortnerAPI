import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ANALYTICS_QUEUE, ANALYTICS_JOBS } from './analytics.constant.js';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Job } from 'bullmq';
import { TrackClickPayload } from './analytics.interface.js';

@Processor(ANALYTICS_QUEUE, { concurrency: 10 })
@Injectable()
export class AnalyticsProcessor extends WorkerHost {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
  ) {
    super();
    this.logger.setContext(AnalyticsProcessor.name);
  }

  async process(job: Job<TrackClickPayload>): Promise<void> {
    try {
      this.logger.debug(
        { jobId: job.id, jobName: job.name },
        'Processing analytics job',
      );

      switch (job.name) {
        case ANALYTICS_JOBS.TRACK_CLICK:
          await this.handleTrackClick(job);
          break;

        default:
          this.logger.warn({ jobName: job.name }, 'Unknown analytics job');
      }
    } catch (error: unknown) {
      this.logger.error(
        { err: error, jobId: job.id },
        'Analytics job processing failed',
      );
      throw error;
    }
  }

  private async handleTrackClick(job: Job<TrackClickPayload>) {
    const { urlId, ip, userAgent } = job.data;

    await this.prisma.$transaction(async (tx) => {
      await tx.clickEvent.create({
        data: {
          urlId,
          ip,
          userAgent,
        },
      });

      await tx.urlStats.update({
        where: { urlId },
        data: {
          totalClicks: { increment: 1 },
        },
      });
    });

    this.logger.debug(
      { urlId, jobId: job.id },
      'Click event stored successfully',
    );
  }
}
