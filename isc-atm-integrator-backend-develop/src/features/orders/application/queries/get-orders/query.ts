import { Query } from '@nestjs/cqrs';
import type { GetOrdersResponse } from './response.dto';

export class GetOrdersQuery extends Query<GetOrdersResponse> {
    public constructor(
        public readonly page: number = 1,
        public readonly limit: number = 10,
    ) {
        super();
    }
}
