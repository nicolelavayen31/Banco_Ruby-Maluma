import { ApiProperty } from '@nestjs/swagger';

export class OrderBuilder {
    private id: string;
    private customerName: string;
    private amount: number;
    private status: (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
    private createdAt: Date;

    public setId(id: string): this {
        this.id = id;
        return this;
    }

    public setCustomerName(customerName: string): this {
        this.customerName = customerName;
        return this;
    }

    public setAmount(amount: number): this {
        this.amount = amount;
        return this;
    }

    public setStatus(
        status: (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS],
    ): this {
        this.status = status;
        return this;
    }

    public setCreatedAt(createdAt: Date): this {
        this.createdAt = createdAt;
        return this;
    }

    public build(): Order {
        return new Order(
            this.id,
            this.customerName,
            this.amount,
            this.status,
            this.createdAt,
        );
    }
}

export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
} as const;

export class Order {
    @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    public readonly id: string;

    @ApiProperty({ example: 'Alice' })
    public readonly customerName: string;

    @ApiProperty({ example: 100 })
    public readonly amount: number;

    @ApiProperty({ enum: ORDER_STATUS })
    public readonly status: (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

    @ApiProperty({ example: '2026-07-09T22:31:30.974Z' })
    public readonly createdAt: Date;

    public constructor(
        id: string,
        customerName: string,
        amount: number,
        status: (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS],
        createdAt: Date,
    ) {
        this.id = id;
        this.customerName = customerName;
        this.amount = amount;
        this.status = status;
        this.createdAt = createdAt;
    }

    public static get Builder(): OrderBuilder {
        return new OrderBuilder();
    }
}
