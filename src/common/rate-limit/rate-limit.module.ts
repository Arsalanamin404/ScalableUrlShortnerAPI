import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module.js';
import { RedisRateLimitService } from './rate-limit.service.js';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard.js';

@Module({
  imports: [RedisModule],
  providers: [
    RedisRateLimitService,
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
  exports: [RedisRateLimitService],
})
export class RateLimitModule {}
