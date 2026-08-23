import { Query } from '@nestjs/cqrs';
import type { GetConciliationsResponse } from './response.dto';

export class GetConciliationsQuery extends Query<GetConciliationsResponse> {
    public constructor(
        public readonly page: number = 1,
        public readonly limit: number = 10,
    ) {
        super();
    }
}
