import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':code')
  @ApiOperation({
    summary: 'Get analytics for a short URL',
    description: 'Returns total click count for the given short code',
  })
  @ApiParam({
    name: 'code',
    example: 'abc123',
    description: 'Short code of the URL',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
    schema: {
      example: {
        shortCode: 'abc123',
        totalClicks: 42,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'URL not found',
  })
  async getAnalytics(@Param('code') code: string) {
    const totalClicks = await this.analyticsService.getUrlAnalytics(code);

    return {
      shortCode: code,
      totalClicks,
    };
  }
}
