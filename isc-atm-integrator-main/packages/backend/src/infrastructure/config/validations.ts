import { INestApplication, ValidationPipe } from '@nestjs/common';

export const validationsSetup = (app: INestApplication) => {
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );
};
