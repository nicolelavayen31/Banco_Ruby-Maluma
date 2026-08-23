import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { validationsSetup } from '@infrastructure/config/validations';
import { versioningSetup } from '@infrastructure/config/versioning';
import { AppConfigService } from '@shared/core/types';
import { corsSetup } from '@infrastructure/config/cors';
import { asyncLocalStorageSetup } from '@infrastructure/config/async-local-storage';
import { csrfSetup } from '@features/auth/infrastructure/csrf.middleware';
import { helmetSetup } from '@infrastructure/config/helmet';
import { swaggerSetup } from '@infrastructure/config/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { snapshot: true });

    const configService = app.get<AppConfigService>(ConfigService);

    const appPort = configService.get('server.port', { infer: true });
    const appPrefix = configService.get('server.prefix', { infer: true });

    versioningSetup(app);

    corsSetup(app);

    validationsSetup(app);

    app.setGlobalPrefix(appPrefix);

    csrfSetup(app);

    helmetSetup(app);

    asyncLocalStorageSetup(app);

    void swaggerSetup(app);

    await app.listen(appPort, '0.0.0.0', () => {
        console.log({ appPort });
    });
}

void bootstrap();
