import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { Redis as RedisClient } from 'ioredis';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClient;
  private bullClient: RedisClient;

  constructor(
    private readonly logger: PinoLogger,
    private readonly config: ConfigService,
  ) {
    this.logger.setContext(RedisService.name);
  }

  onModuleInit() {
    this.client = new (Redis as any)({
      host: this.config.getOrThrow<string>('REDIS_HOST'),
      port: this.config.getOrThrow<number>('REDIS_PORT'),
    });

    this.bullClient = new (Redis as any)({
      host: this.config.getOrThrow<string>('REDIS_HOST'),
      port: this.config.getOrThrow<number>('REDIS_PORT'),
      maxRetriesPerRequest: null,
    });

    this.client.on('connect', () => {
      this.logger.info('Redis connected');
    });

    this.client.on('error', (err) => {
      this.logger.error({ err }, 'Redis error');
    });

    this.client.on('close', () => {
      this.logger.warn('Redis connection closed');
    });
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
      await this.bullClient.quit();
      this.logger.info('Redis connection closed gracefully');
    } catch (err: unknown) {
      this.logger.error({ err }, 'Error closing Redis connection');
    }
  }

  getClient() {
    return this.client;
  }

  getBullClient() {
    return this.bullClient;
  }

  async set<T = any>(
    key: string,
    value: T,
    ttlInSeconds?: number,
  ): Promise<void> {
    const serialized = JSON.stringify(value);

    if (ttlInSeconds && ttlInSeconds > 0) {
      await this.client.set(key, serialized, 'EX', ttlInSeconds);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  async del(keys: string | string[]) {
    if (Array.isArray(keys)) {
      return this.client.del(...keys);
    }
    return this.client.del(keys);
  }
}
