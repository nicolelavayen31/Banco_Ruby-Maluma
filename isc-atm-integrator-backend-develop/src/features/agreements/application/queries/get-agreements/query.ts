import { Query } from '@nestjs/cqrs';
import type { GetAgreementsResponse } from './response.dto';

export class GetAgreementsQuery extends Query<GetAgreementsResponse> {
    public constructor(
        public readonly page: number = 1,
        public readonly limit: number = 10,
        public readonly state?: string,
    ) {
        super();
    }
}
