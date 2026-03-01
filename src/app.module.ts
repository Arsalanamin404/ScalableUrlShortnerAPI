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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'info',
        transport: {
          targets: [
            // Console logs
            {
              target: 'pino-pretty',
              options: {
                colorize: true,
              },
            },

            // All logs
            {
              level: 'info',
              target: 'pino/file',
              options: {
                destination: './logs/app.log',
                mkdir: true,
              },
            },

            // Errors only
            {
              level: 'error',
              target: 'pino/file',
              options: {
                destination: './logs/error.log',
                mkdir: true,
              },
            },
          ],
        },
      },
    }),
    UrlModule,
    PrismaModule,
    RedisModule,
    RateLimitModule,
    JobsModule,
    BullConfig,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
