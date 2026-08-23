import { ApiKeyEntity } from '../infrastructure/persistence/typeorm/api-key.entity';
import { ApiKey } from './api-key';

export const API_KEY_REPOSITORY = Symbol('API_KEY_REPOSITORY');

export interface IApiKeyRepository {
    save(apiKey: ApiKey): Promise<ApiKeyEntity>;
    findById(id: string): Promise<ApiKeyEntity | null>;
    findByHash(keyHash: string): Promise<ApiKeyEntity | null>;
    findAllByAgreement(
        agreementId: string,
        page: number,
        limit: number,
    ): Promise<{
        items: ApiKeyEntity[];
        total: number;
        page: number;
        limit: number;
    }>;
}
