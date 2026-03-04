import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  const PORT = configService.get<number>('PORT') ?? 3000;
  const NODE_ENV = configService.get<string>('NODE_ENV');

  app.setGlobalPrefix('api/v1');

  if (NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('URL Shortener API')
      .setDescription('Production-grade URL shortener with Redis caching')
      .setVersion('1.0')
      .addTag('url')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api/v1/docs', app, document);

    fs.writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
  }
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(PORT);
  console.log(`server listening on: http://localhost:${PORT}/api/v1`);
}
await bootstrap();
