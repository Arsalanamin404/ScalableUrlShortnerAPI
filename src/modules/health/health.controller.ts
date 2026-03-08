import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../common/redis/redis.service.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    this.logger.setContext(HealthController.name);
  }
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Checks if the application is running',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-03-08T10:00:00.000Z',
      },
    },
  })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      await this.redis.ping();
      return {
        status: 'ok',
        services: {
          postgres: 'up',
          redis: 'up',
          },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw new InternalServerErrorException('Health check failed');
    }
  }
}
