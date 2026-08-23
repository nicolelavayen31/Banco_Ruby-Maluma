import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrderEntity } from './infrastructure/persistence/typeorm/order.entity';
import { ORDER_REPOSITORY } from './domain/order.repository';
import { OrderRepository } from './infrastructure/persistence/typeorm/order.repository';
import { OrdersController } from './presentation/orders.controller';
import { CreateOrderHandler } from './application/commands/create-order/handler';
import { GetOrdersHandler } from './application/queries/get-orders/handler';
import { GetOrderByIdHandler } from './application/queries/get-order-by-id/handler';
import { CacheResultService } from '@shared/core/cache/cache-result.service';

@Module({
    imports: [TypeOrmModule.forFeature([OrderEntity]), CqrsModule],
    controllers: [OrdersController],
    providers: [
        {
            provide: ORDER_REPOSITORY,
            useFactory: (dataSource: DataSource) =>
                new OrderRepository(dataSource),
            inject: [DataSource],
        },
        CacheResultService,
        CreateOrderHandler,
        GetOrdersHandler,
        GetOrderByIdHandler,
    ],
})
export class OrdersModule {}
