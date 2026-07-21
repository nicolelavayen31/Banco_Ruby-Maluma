import type { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

export function helmetSetup(app: INestApplication) {
    app.use(
        helmet({
            contentSecurityPolicy: false,
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            crossOriginOpenerPolicy: false,
            crossOriginEmbedderPolicy: false,
            originAgentCluster: false,
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
            strictTransportSecurity: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
            xContentTypeOptions: true,
            xDnsPrefetchControl: { allow: false },
            xFrameOptions: false,
            xPermittedCrossDomainPolicies: { permittedPolicies: 'none' },
            xPoweredBy: true,
            xXssProtection: false,
        }),
    );
}
