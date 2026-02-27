import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    super({ adapter });
  }

  async onModuleInit() {
    try {
      console.log('DATABASE_URL at runtime:', process.env.DATABASE_URL);
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
