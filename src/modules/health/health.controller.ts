import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PinoLogger } from 'nestjs-pino';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly logger: PinoLogger) {
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
  check() {
    try {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw new InternalServerErrorException('Health check failed');
    }
  }
}
