import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class UrlRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { longUrl: string; shortCode: string; expiresAt?: Date }) {
    return this.prisma.url.create({
      data,
    });
  }

  async findByShortCode(shortCode: string) {
    return this.prisma.url.findUnique({
      where: { shortCode },
    });
  }
}
