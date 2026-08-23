import { ApiProperty } from '@nestjs/swagger';
import { IApiResponse } from '@core/response/api-response';
import type { IApiResponseMetadata } from '@core/response/api-response-metadata';
import { ResponseMetadata } from '@core/response/api-response-metadata';
import { Order } from '@features/orders/domain/order';

export class GetOrdersResponse implements IApiResponse<Order[]> {
    @ApiProperty({ type: () => Order, isArray: true })
    public readonly data: Order[];

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(data: Order[], metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }
}
