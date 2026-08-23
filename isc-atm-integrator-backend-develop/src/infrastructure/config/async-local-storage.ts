import { INestApplication } from '@nestjs/common';
import { ClsMiddleware } from 'nestjs-cls/dist/src/lib/cls-initializers/cls.middleware';
import { randomUUID } from 'node:crypto';

export const asyncLocalStorageSetup = (app: INestApplication) => {
    const middleware = new ClsMiddleware({
        generateId: true,
        idGenerator: (req) =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            (req.headers['x-request-id'] as string) || randomUUID(),
    });

    app.use(middleware.use);
};
