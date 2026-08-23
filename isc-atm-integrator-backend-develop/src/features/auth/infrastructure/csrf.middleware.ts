import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, NextFunction } from 'express';
import type { AppConfigService } from '@shared/core/types';
import { CsrfService } from '../application/csrf.service';
import cookieParser from 'cookie-parser';

export function csrfSetup(app: INestApplication) {
    const configService = app.get<AppConfigService>(ConfigService);

    const enabled = configService.get('security.csrf.enabled', {
        infer: true,
    });

    if (!enabled) {
        app.use((_req: Request, _res: Response, next: NextFunction) => {
            next();
        });
        return;
    }

    app.enableShutdownHooks();
    app.use(cookieParser());

    const csrfService = app.get(CsrfService);
    const appPrefix = configService.get('server.prefix', { infer: true });
    const csrfProtection = csrfService.getProtectionMiddleware();

    app.use((req: Request, res: Response, next: NextFunction) => {
        if (
            req.path.startsWith(`${appPrefix}/health`) ||
            req.path.startsWith(`${appPrefix}/csrf-token`)
        ) {
            return next();
        }
        // Skip CSRF validation for API Key authentication (external systems)
        if (req.headers['x-api-key']) {
            return next();
        }
        csrfProtection(req, res, next);
    });
}
