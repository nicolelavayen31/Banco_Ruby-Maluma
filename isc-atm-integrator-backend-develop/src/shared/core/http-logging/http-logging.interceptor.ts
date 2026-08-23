import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const http = context.switchToHttp();
        const request = http.getRequest();
        const { method, url } = request;
        const now = Date.now();

        const skipHealth = url === '/health' || url.startsWith('/health/');

        if (!skipHealth) {
            this.logger.debug(`--> ${method} ${url}`);
        }

        return next.handle().pipe(
            finalize(() => {
                if (skipHealth) return;

                const response = http.getResponse();
                const statusCode = response.statusCode;
                const duration = Date.now() - now;
                this.logger.debug(
                    `<-- ${statusCode} ${method} ${url} ${duration}ms`,
                );
            }),
        );
    }
}
