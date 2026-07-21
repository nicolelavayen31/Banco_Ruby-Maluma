import { Query } from '@nestjs/cqrs';
import type { GetAccountsResponse } from './response.dto';

export class GetAccountsQuery extends Query<GetAccountsResponse> {
    public constructor(
        public readonly page: number = 1,
        public readonly limit: number = 10,
        public readonly agreementId?: string,
        public readonly type?: string,
        public readonly state?: string,
    ) {
        super();
    }
}
