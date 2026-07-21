import { NotFoundException, Inject, HttpStatus } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
    ResilienceCommand,
    CircuitBreakerStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { ORDER_REPOSITORY } from '@features/orders/domain/order.repository';
import type { IOrderRepository } from '@features/orders/domain/order.repository';
import { GetOrderByIdQuery } from './query';
import { GetOrderByIdResponse } from './response.dto';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';
import { Order } from '@features/orders/domain/order';

@QueryHandler(GetOrderByIdQuery)
export class GetOrderByIdHandler
    extends ResilienceCommand
    implements IQueryHandler<GetOrderByIdQuery, GetOrderByIdResponse>
{
    public constructor(
        @Inject(ORDER_REPOSITORY) private readonly repository: IOrderRepository,
    ) {
        super([
            new CircuitBreakerStrategy({
                requestVolumeThreshold: 3,
                sleepWindowInMilliseconds: 10_000,
                errorThresholdPercentage: 50,
            }),
            new TimeoutStrategy(3000),
        ]);
    }

    public async run(query: GetOrderByIdQuery): Promise<GetOrderByIdResponse> {
        const order = await this.repository.findById(query.getId());
        if (!order) {
            throw new NotFoundException(
                `Order with ID ${query.getId()} not found`,
            );
        }

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.OK)
            .setMessage('OK')
            .build();

        const result = {} as Order;
        const response = new GetOrderByIdResponse(result, metadata);

        return response;
    }
}
