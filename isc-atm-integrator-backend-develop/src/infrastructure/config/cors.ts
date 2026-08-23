import { INestApplication } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from '@shared/core/types';

export const corsSetup = (app: INestApplication) => {
    const configService = app.get<AppConfigService>(ConfigService);

    const { credentials, methods, origin } = configService.get('server.cors', {
        infer: true,
    });

    const corsConfig: CorsOptions = {
        origin,
        methods,
        credentials,
    };

    app.enableCors(corsConfig);
};
