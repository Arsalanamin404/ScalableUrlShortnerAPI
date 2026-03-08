import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

export const BullConfig = BullModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const redisUrl = config.getOrThrow<string>('REDIS_URL');

    if (redisUrl) {
      return {
        connection: {
          url: redisUrl,
        },
      };
    }

    return {
      connection: {
        host: config.getOrThrow<string>('REDIS_HOST'),
        port: config.getOrThrow<number>('REDIS_PORT'),
      },
    };
  },
});
