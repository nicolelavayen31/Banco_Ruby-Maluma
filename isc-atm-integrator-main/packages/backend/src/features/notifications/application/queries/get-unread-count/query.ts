import { Query } from '@nestjs/cqrs';
import { GetUnreadCountResponse } from './response.dto';

export class GetUnreadCountQuery extends Query<GetUnreadCountResponse> {
    constructor(public readonly recipientId: string = 'all') {
        super();
    }
}
