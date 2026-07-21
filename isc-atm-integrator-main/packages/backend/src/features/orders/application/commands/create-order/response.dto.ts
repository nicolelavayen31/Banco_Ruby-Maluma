import { Order } from '@features/orders/domain/order';
import { ApiProperty } from '@nestjs/swagger';
import { IApiResponse } from '@shared/core/response/api-response';
import {
    type IApiResponseMetadata,
    ResponseMetadata,
} from '@shared/core/response/api-response-metadata';

export class CreateOrderResponse implements IApiResponse<Order> {
    @ApiProperty({ type: () => Order })
    public readonly data: Order;

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(data: Order, metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }
}
