import { INestApplication, VersioningType } from '@nestjs/common';

export const versioningSetup = (app: INestApplication) => {
    app.enableVersioning({
        type: VersioningType.HEADER,
        header: 'x-api-version',
    });
};
