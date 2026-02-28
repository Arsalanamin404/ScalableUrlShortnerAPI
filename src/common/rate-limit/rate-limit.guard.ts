import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { RedisRateLimitService } from './rate-limit.service.js';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RATE_LIMIT_KEY, RateLimitOptions } from './rate-limit.decorator.js';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RedisRateLimitService,
    private readonly reflector: Reflector,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RateLimitGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    ) ?? { limit: 10, duration: 60 };

    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const userId = (req as any).user?.id;
    const ip = req.ip;

    const handler = context.getHandler().name;
    const controller = context.getClass().name;

    const routeKey = `${controller}:${handler}`;
    const key = userId ? `user:${userId}:${routeKey}` : `ip:${ip}:${routeKey}`;

    try {
      const result = await this.rateLimitService.consume(key, {
        keyPrefix: 'rate_limit',
        points: options.limit!,
        duration: options.duration!,
        blockDuration: options.blockDuration!,
      });

      res.setHeader('X-RateLimit-Limit', options.limit!);
      res.setHeader('X-RateLimit-Remaining', result.remainingPoints);
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.msBeforeNext / 1000));
      this.logger.info(
        {
          key,
          userId,
          ip,
          route: routeKey,
          remainingPoints: result.remainingPoints,
          resetInSec: Math.ceil(result.msBeforeNext / 1000),
        },
        'Rate limit check passed',
      );
      return true;
    } catch (err: unknown) {
      this.logger.error(
        { key, err },
        'Too many requests. Please try again later.',
      );
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
