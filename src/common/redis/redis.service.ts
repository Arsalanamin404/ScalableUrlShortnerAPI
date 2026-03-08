import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { Redis as RedisClient } from 'ioredis';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClient;

  constructor(
    private readonly logger: PinoLogger,
    private readonly config: ConfigService,
  ) {
    this.logger.setContext(RedisService.name);
  }

  onModuleInit() {
    const nodeEnv = this.config.getOrThrow<string>('NODE_ENV');

    if (nodeEnv === 'production') {
      const redisUrl = this.config.getOrThrow<string>('REDIS_URL');

      this.client = new (Redis as any)(redisUrl, {
        maxRetriesPerRequest: 3,
      });

      this.logger.info('Connecting to Redis using REDIS_URL');
    } else {
      const host = this.config.getOrThrow<string>('REDIS_HOST');
      const port = this.config.getOrThrow<number>('REDIS_PORT');

      this.client = new (Redis as any)({
        host,
        port,
        maxRetriesPerRequest: 3,
      });

      this.logger.info({ host, port }, 'Connecting to Redis using host/port');
    }

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
      this.logger.info('Redis connection closed gracefully');
    } catch (err: unknown) {
      this.logger.error({ err }, 'Error closing Redis connection');
    }
  }

  getClient() {
    return this.client;
  }

  async ping(): Promise<string> {
    return this.client.ping();
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
