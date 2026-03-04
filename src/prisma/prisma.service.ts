import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
    });
    super({ adapter });
  }

  async onModuleInit() {
    try {
      console.log(
        'DATABASE_URL at runtime:',
        this.configService.getOrThrow<string>('DATABASE_URL'),
      );
      await this.$connect();
      console.log('CONNECTED TO THE DB!');
    } catch (error) {
      console.error('ERROR OCCURRED WHILE CONNECTING TO THE DB:', error);
    }
  }
  async onModuleDestroy() {
    try {
      await this.$disconnect();
      console.log('DISCONNECTED FROM THE DB!');
    } catch (error) {
      console.error('ERROR OCCURRED WHILE DISCONNECTING FROM THE DB:', error);
    }
  }
}
