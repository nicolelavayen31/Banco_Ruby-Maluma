import { Query } from '@nestjs/cqrs';
import { GetNotificationsResponse } from './response.dto';

export class GetNotificationsQuery extends Query<GetNotificationsResponse> {
    constructor(
        public readonly page: number = 1,
        public readonly limit: number = 10,
        public readonly unreadOnly: boolean = false,
    ) {
        super();
    }
}
