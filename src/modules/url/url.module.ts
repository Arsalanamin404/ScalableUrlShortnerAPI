import { Module } from '@nestjs/common';
import { UrlController } from './url.controller.js';
import { UrlService } from './url.service.js';
import { UrlRepository } from './repositories/url.repository.js';

@Module({
  controllers: [UrlController],
  providers: [UrlService, UrlRepository],
})
export class UrlModule {}
