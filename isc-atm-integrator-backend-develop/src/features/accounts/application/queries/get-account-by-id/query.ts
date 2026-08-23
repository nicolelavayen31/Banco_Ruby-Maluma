import { Query } from '@nestjs/cqrs';
import type { GetAccountByIdResponse } from './response.dto';

export class GetAccountByIdQuery extends Query<GetAccountByIdResponse> {
    public constructor(private readonly id: string) {
        super();
    }

    public getId(): string {
        return this.id;
    }
}
