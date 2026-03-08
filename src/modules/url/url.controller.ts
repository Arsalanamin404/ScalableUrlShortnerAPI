import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { UrlService } from './url.service.js';
import { CreateUrlDto } from './dto/create-url.dto.js';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RateLimit } from '../../common/rate-limit/rate-limit.decorator.js';
import type { Request, Response } from 'express';

@ApiTags('URL')
@Controller('url')
export class UrlController {
  constructor(private readonly service: UrlService) {}

  @Post()
  @RateLimit({ duration: 60, limit: 10 })
  @ApiOperation({ summary: 'Create a short URL' })
  @ApiBody({ type: CreateUrlDto })
  @ApiResponse({
    status: 201,
    description: 'Short URL created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  async create(@Body() dto: CreateUrlDto) {
    const created = await this.service.create(dto.longUrl, dto.expiresAt);
    return {
      id: created.id.toString(),
      longUrl: created.longUrl,
      shortCode: created.shortCode,
      expiresAt: created.expiresAt,
      createdAt: created.createdAt,
    };
  }

  @Get(':code')
  @ApiOperation({ summary: 'Redirect to original URL' })
  @ApiParam({
    name: 'code',
    example: 'abc123',
    description: 'Short code of the URL',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to original URL',
  })
  @ApiResponse({
    status: 404,
    description: 'URL not found or expired',
  })
  async redirect(
    @Param('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const url = await this.service.redirect(
      code,
      req.ip,
      req.headers['user-agent'],
    );
    return res.redirect(url);
  }
}
