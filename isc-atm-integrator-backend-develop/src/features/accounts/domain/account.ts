import { ApiProperty } from '@nestjs/swagger';

export class BankAccountBuilder {
    private id: string;
    private reference: string;
    private type: (typeof ACCOUNT_TYPE)[keyof typeof ACCOUNT_TYPE];
    private balance: number;
    private state: (typeof ACCOUNT_STATE)[keyof typeof ACCOUNT_STATE];
    private agreementId: string;
    private createdAt: Date;
    private updatedAt: Date;
    private deletedAt?: Date;

    public setId(id: string): this {
        this.id = id;
        return this;
    }

    public setReference(reference: string): this {
        this.reference = reference;
        return this;
    }

    public setType(
        type: (typeof ACCOUNT_TYPE)[keyof typeof ACCOUNT_TYPE],
    ): this {
        this.type = type;
        return this;
    }

    public setBalance(balance: number): this {
        this.balance = balance;
        return this;
    }

    public setState(
        state: (typeof ACCOUNT_STATE)[keyof typeof ACCOUNT_STATE],
    ): this {
        this.state = state;
        return this;
    }

    public setAgreementId(agreementId: string): this {
        this.agreementId = agreementId;
        return this;
    }

    public setCreatedAt(createdAt: Date): this {
        this.createdAt = createdAt;
        return this;
    }

    public setUpdatedAt(updatedAt: Date): this {
        this.updatedAt = updatedAt;
        return this;
    }

    public setDeletedAt(deletedAt?: Date): this {
        this.deletedAt = deletedAt;
        return this;
    }

    public build(): BankAccount {
        return new BankAccount(
            this.id,
            this.reference,
            this.type,
            this.balance,
            this.state,
            this.agreementId,
            this.createdAt,
            this.updatedAt,
            this.deletedAt,
        );
    }
}

export const ACCOUNT_TYPE = {
    SAVINGS: 'savings',
    CHECKING: 'checking',
} as const;

export const ACCOUNT_STATE = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

export class BankAccount {
    @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    public readonly id: string;

    @ApiProperty({ example: 'ACC-001' })
    public readonly reference: string;

    @ApiProperty({ enum: ACCOUNT_TYPE })
    public readonly type: (typeof ACCOUNT_TYPE)[keyof typeof ACCOUNT_TYPE];

    @ApiProperty({ example: 100000, description: 'Balance in cents' })
    public readonly balance: number;

    @ApiProperty({ enum: ACCOUNT_STATE })
    public readonly state: (typeof ACCOUNT_STATE)[keyof typeof ACCOUNT_STATE];

    @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    public readonly agreementId: string;

    @ApiProperty({ example: '2026-07-09T22:31:30.974Z' })
    public readonly createdAt: Date;

    @ApiProperty({ example: '2026-07-09T22:31:30.974Z' })
    public readonly updatedAt: Date;

    @ApiProperty({ example: '2026-07-09T22:31:30.974Z', required: false })
    public readonly deletedAt?: Date;

    public constructor(
        id: string,
        reference: string,
        type: (typeof ACCOUNT_TYPE)[keyof typeof ACCOUNT_TYPE],
        balance: number,
        state: (typeof ACCOUNT_STATE)[keyof typeof ACCOUNT_STATE],
        agreementId: string,
        createdAt: Date,
        updatedAt: Date,
        deletedAt?: Date,
    ) {
        this.id = id;
        this.reference = reference;
        this.type = type;
        this.balance = balance;
        this.state = state;
        this.agreementId = agreementId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
    }

    public static get Builder(): BankAccountBuilder {
        return new BankAccountBuilder();
    }
}
