import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    constructor(
        private readonly httpAdapterHost: HttpAdapterHost,
        private readonly cls: ClsService,
    ) {}

    public catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const httpAdapter = this.httpAdapterHost.httpAdapter;

        const httpException = this.toHttpException(exception);

        const responseBody = {
            id: this.cls.getId() || 'unknown',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            path: httpAdapter.getRequestUrl(ctx.getRequest()),
            code: HttpStatus[httpException.getStatus()],
            status: httpException.getStatus(),
            message: httpException.message,
            cause: httpException.cause,
            timestamp: new Date().toISOString(),
        };

        this.logger.error(
            `Exception caught: ${JSON.stringify(responseBody)}`,
            exception instanceof Error ? exception.stack : undefined,
        );

        httpAdapter.reply(
            ctx.getResponse(),
            responseBody,
            httpException.getStatus(),
        );
    }

    private toHttpException(exception: unknown): HttpException {
        if (exception instanceof HttpException) {
            return exception;
        }

        if (exception instanceof Error) {
            return new HttpException(
                {
                    message: exception.message,
                    cause: exception.cause,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return new HttpException(
            'Internal server error',
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
}
