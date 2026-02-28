import { RateLimiterRedis } from 'rate-limiter-flexible';
import { RedisService } from '../redis/redis.service.js';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

type LimiterOptions = {
  keyPrefix: string;
  points: number;
  duration: number;
  blockDuration?: number;
};

@Injectable()
export class RedisRateLimitService implements OnModuleInit {
  private limiters = new Map<string, RateLimiterRedis>();

  constructor(
    private readonly redis: RedisService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RedisRateLimitService.name);
  }

  onModuleInit() {
    this.logger.info('Rate limiter initialized');
  }

  private getLimiter(options: LimiterOptions): RateLimiterRedis {
    const key = `${options.keyPrefix}:${options.points}:${options.duration}:${options.blockDuration}`;

    if (this.limiters.has(key)) {
      return this.limiters.get(key)!;
    }

    const limiter = new RateLimiterRedis({
      storeClient: this.redis.getClient(),
      keyPrefix: options.keyPrefix,
      points: options.points,
      duration: options.duration,
      blockDuration: options.blockDuration ?? 0,
    });

    this.limiters.set(key, limiter);
    this.logger.info(`Created limiter: ${key}`);

    return limiter;
  }

  async consume(key: string, options: LimiterOptions, points = 1) {
    const limiter = this.getLimiter(options);
    try {
      return await limiter.consume(key, points);
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(
          `Rate limiter error | key=${key} | message=${err.message}`,
          err.stack,
        );
      } else {
        this.logger.error(`Rate limiter error | key=${key} | unknown error`);
      }

      throw err;
    }
  }
}
