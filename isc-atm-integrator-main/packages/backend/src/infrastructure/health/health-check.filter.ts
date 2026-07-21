import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    ServiceUnavailableException,
} from '@nestjs/common';

@Catch(ServiceUnavailableException)
export class HealthCheckFilter implements ExceptionFilter {
    public catch(
        exception: ServiceUnavailableException,
        host: ArgumentsHost,
    ): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const exceptionResponse = exception.getResponse();

        const isHealthCheckResponse =
            typeof exceptionResponse === 'object' &&
            exceptionResponse !== null &&
            'status' in exceptionResponse &&
            'info' in exceptionResponse &&
            'details' in exceptionResponse;

        if (isHealthCheckResponse) {
            response.status(exception.getStatus()).json(exceptionResponse);
            return;
        }

        throw exception;
    }
}
