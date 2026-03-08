import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UrlModule } from './modules/url/url.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './common/redis/redis.module.js';
import envConfig from './config/env.config.js';
import { LoggerModule } from 'nestjs-pino';
import { RateLimitModule } from './common/rate-limit/rate-limit.module.js';
import { JobsModule } from './common/jobs/jobs.module.js';
import { BullConfig } from './common/redis/bull.config.js';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { envValidationSchema } from './config/env.validation.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validationSchema: envValidationSchema,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
              }
            : undefined,
      },
    }),
    UrlModule,
    PrismaModule,
    RedisModule,
    RateLimitModule,
    JobsModule,
    BullConfig,
    AnalyticsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
