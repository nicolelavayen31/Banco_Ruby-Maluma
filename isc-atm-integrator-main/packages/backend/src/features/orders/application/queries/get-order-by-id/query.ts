import { Query } from '@nestjs/cqrs';
import type { GetOrderByIdResponse } from './response.dto';

export class GetOrderByIdQuery extends Query<GetOrderByIdResponse> {
    public constructor(private readonly id: string) {
        super();
    }

    public getId(): string {
        return this.id;
    }
}
