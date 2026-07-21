import { OrderEntity } from '../infrastructure/persistence/typeorm/order.entity';
import { Order } from './order';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface IOrderRepository {
    save(order: Order): Promise<OrderEntity>;
    findById(id: string): Promise<OrderEntity | null>;
    findAll(
        page: number,
        limit: number,
    ): Promise<{
        items: OrderEntity[];
        total: number;
        page: number;
        limit: number;
    }>;
}
