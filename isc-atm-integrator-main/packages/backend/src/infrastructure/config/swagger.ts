import { INestApplication } from '@nestjs/common';
import {
    DocumentBuilder,
    SwaggerDocumentOptions,
    SwaggerModule,
} from '@nestjs/swagger';
import { ApiResponseError } from '@shared/core/response/api-response-error';
import { ConfigService } from '@nestjs/config';
import {
    apiReference,
    NestJSReferenceConfiguration,
} from '@scalar/nestjs-api-reference';
import { AppConfigService } from '@shared/core/types';

import swaggerMetadata from '../../metadata';

export const swaggerSetup = async (app: INestApplication<any>) => {
    const configService = app.get<AppConfigService>(ConfigService);

    const appPrefix = configService.get('server.prefix', { infer: true });

    const manifest = new DocumentBuilder()
        .setTitle('ISC ATM Integrator')
        .setDescription(
            'ATM integration layer — routes transactions between ATMs and financial institutions',
        )
        .setVersion('1.0')
        .addTag('Orders')
        .addTag('Agreements')
        .addTag('Accounts')
        .addTag('Transactions')
        .addTag('Auth')
        .addTag('Health')
        .addServer(appPrefix, 'Local API with prefix')
        .addGlobalParameters({
            name: 'x-api-version',
            in: 'header',
            description: 'API version',
            required: true,
            schema: { type: 'string', default: '1' },
        })
        .addGlobalParameters({
            name: 'x-csrf-token',
            in: 'header',
            description:
                'CSRF token from GET /csrf-token. Required for POST, PUT, PATCH, DELETE',
            required: true,
            schema: {
                type: 'string',
                default: 'xxx.yyy',
            },
        })
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT access token from POST /auth/login',
            },
            'bearer',
        )
        .addApiKey(
            {
                type: 'apiKey',
                name: 'x-api-key',
                in: 'header',
                description: 'API key for machine-to-machine auth. Prefix: sk-',
            },
            'api-key',
        )
        .addGlobalResponse({
            status: '4XX',
            description: 'Client error',
            type: ApiResponseError,
        })
        .addGlobalResponse({
            status: '5XX',
            description: 'Internal server error',
            type: ApiResponseError,
        })
        .addGlobalResponse({
            status: 'default',
            description: 'Unexpected error',
            type: ApiResponseError,
        })
        .build();

    const options: SwaggerDocumentOptions = {
        ignoreGlobalPrefix: true,
    };

    await SwaggerModule.loadPluginMetadata(swaggerMetadata);

    const swaggerDocument = SwaggerModule.createDocument(
        app,
        manifest,
        options,
    );

    const swaggerSetup: NestJSReferenceConfiguration = {
        theme: 'purple',
        content: swaggerDocument,
        authentication: {
            preferredSecurityScheme: 'bearer',
        },
    };

    app.setGlobalPrefix(appPrefix);

    app.use(`${appPrefix}/reference`, apiReference(swaggerSetup));
};
