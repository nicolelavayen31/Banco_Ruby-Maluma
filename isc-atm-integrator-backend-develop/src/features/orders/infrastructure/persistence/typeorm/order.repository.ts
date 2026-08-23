import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { IOrderRepository } from '@features/orders/domain/order.repository';
import { OrderEntity } from './order.entity';

@Injectable()
export class OrderRepository
    extends Repository<OrderEntity>
    implements IOrderRepository
{
    constructor(private readonly dataSource: DataSource) {
        super(OrderEntity, dataSource.createEntityManager());
    }

    public async findById(id: string): Promise<OrderEntity | null> {
        return this.findOneBy({ id });
    }

    public async findAll(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [items, total] = await this.findAndCount({
            skip,
            take: limit,
        });
        return {
            items,
            total,
            page,
            limit,
        };
    }
}
