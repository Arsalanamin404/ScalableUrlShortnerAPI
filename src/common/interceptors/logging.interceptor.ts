import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const requestId = randomUUID();
    request.id = requestId;

    const start = Date.now();

    this.logger.info(
      {
        requestId,
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
      'Incoming request',
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;

        this.logger.info(
          {
            requestId,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
          },
          'Request completed',
        );
      }),
    );
  }
}
