import { Query } from '@nestjs/cqrs';
import type { GetAgreementByIdResponse } from './response.dto';

export class GetAgreementByIdQuery extends Query<GetAgreementByIdResponse> {
    public constructor(private readonly id: string) {
        super();
    }

    public getId(): string {
        return this.id;
    }
}
