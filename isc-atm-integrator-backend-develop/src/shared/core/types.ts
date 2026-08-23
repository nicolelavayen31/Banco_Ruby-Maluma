import configuration from '@infrastructure/config/configuration';
import { ConfigService } from '@nestjs/config';

export interface IBuilder<T> {
    build(): T;
}

export type AppConfigService = ConfigService<
    ReturnType<typeof configuration>,
    true
>;
