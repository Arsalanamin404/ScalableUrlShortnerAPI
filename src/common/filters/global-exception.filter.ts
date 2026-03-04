import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const requestId = request.id;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'INTERNAL SERVER ERROR';
    let stack: string | undefined = '';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      message =
        typeof res === 'string'
          ? res
          : ((res as { message?: string | string[] }).message ??
            'Unexpected error');
    }

    if (exception instanceof Error) {
      stack = exception.stack;
    }
    this.logger.error({
      requestId,
      status,
      stack,
      message,
      path: request.url,
    });
    response.status(status).json({
      requestId,
      statusCode: status,
      stack,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
