import { Query } from '@nestjs/cqrs';
import type { GetTransactionByIdResponse } from './response.dto';

export class GetTransactionByIdQuery extends Query<GetTransactionByIdResponse> {
    public constructor(private readonly id: string) {
        super();
    }

    public getId(): string {
        return this.id;
    }
}
