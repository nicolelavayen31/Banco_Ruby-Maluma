import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('orders')
export class OrderEntity {
    @PrimaryColumn({ name: 'id', type: 'uuid' })
    public id: string;

    @Column({ name: 'customer_name' })
    public customerName: string;

    @Column({ name: 'amount' })
    public amount: number;

    @Column({ name: 'status' })
    public status: string;

    @Column({ name: 'created_at' })
    public createdAt: Date;
}
