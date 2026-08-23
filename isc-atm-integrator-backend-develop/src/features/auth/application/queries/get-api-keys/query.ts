import { Query } from '@nestjs/cqrs';
import type { GetApiKeysResponse } from './response.dto';

export class GetApiKeysQuery extends Query<GetApiKeysResponse> {
    public constructor(
        public readonly agreementId: string,
        public readonly page: number = 1,
        public readonly limit: number = 10,
    ) {
        super();
    }
}
