import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { doubleCsrf } from 'csrf-csrf';
import type { Request, Response, NextFunction } from 'express';
import type { AppConfigService } from '@shared/core/types';

@Injectable()
export class CsrfService {
    private readonly generateTokenFn: (req: Request, res: Response) => string;
    private readonly protectFn: (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => void;

    constructor(configService: ConfigService) {
        const cfg = configService as unknown as AppConfigService;
        const csrfCfg = cfg.get('security.csrf', { infer: true });
        const isProd = !cfg.get('app.isDevMode', { infer: true });

        const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
            size: 32,
            cookieName: csrfCfg.cookieName,
            ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
            cookieOptions: {
                sameSite: 'strict',
                path: '/',
                secure: isProd,
                httpOnly: false,
            },
            getSecret: () => csrfCfg.secret,
            getSessionIdentifier: (req) => String(req.ip),
            getCsrfTokenFromRequest: (req) =>
                String(req.headers?.['x-csrf-token']),
        });

        this.generateTokenFn = generateCsrfToken as (
            req: Request,
            res: Response,
        ) => string;

        this.protectFn = (req: Request, res: Response, next: NextFunction) => {
            doubleCsrfProtection(req, res, (error?: unknown) => {
                if (error) {
                    const httpError = error as {
                        statusCode?: number;
                        message?: string;
                    };
                    next(
                        new HttpException(
                            httpError.message ?? 'CSRF validation failed',
                            httpError.statusCode ?? HttpStatus.FORBIDDEN,
                        ),
                    );
                    return;
                }
                next();
            });
        };
    }

    public getToken(req: Request, res: Response): { token: string } {
        const token = this.generateTokenFn(req, res);
        return { token };
    }

    public getProtectionMiddleware(): (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => void {
        return this.protectFn;
    }
}
