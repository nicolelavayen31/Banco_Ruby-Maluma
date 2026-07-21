import { Query } from '@nestjs/cqrs';
import type { GetTransactionsResponse } from './response.dto';

export class GetTransactionsQuery extends Query<GetTransactionsResponse> {
    public constructor(
        public readonly page: number = 1,
        public readonly limit: number = 10,
        public readonly accountId?: string,
        public readonly correlationId?: string,
        public readonly operation?: string,
        public readonly state?: string,
        public readonly sourceBank?: string,
    ) {
        super();
    }
}
