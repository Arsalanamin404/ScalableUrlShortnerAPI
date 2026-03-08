import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AnalyticsService.name);
  }

  async getUrlAnalytics(shortCode: string) {
    const url = await this.prisma.url.findUnique({
      where: { shortCode },
      select: {
        id: true,
        urlStats: {
          select: {
            totalClicks: true,
          },
        },
      },
    });

    if (!url) {
      this.logger.warn({ shortCode }, 'URL not found for analytics');
      throw new NotFoundException('Url Not Found');
    }

    const totalClicks = url.urlStats?.totalClicks ?? 0;

    this.logger.info(
      { shortCode, totalClicks },
      'Fetched URL analytics successfully',
    );

    return totalClicks;
  }
}
