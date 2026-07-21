import { ApiProperty } from '@nestjs/swagger';

export class TransactionBuilder {
    private id: string;
    private amount?: number;
    private operation: (typeof TRANSACTION_OPERATION)[keyof typeof TRANSACTION_OPERATION];
    private type?: (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];
    private state: (typeof TRANSACTION_STATE)[keyof typeof TRANSACTION_STATE];
    private description: string;
    private bankAccountId: string;
    private correlationId?: string;
    private sourceBank: string = 'bank_a';
    private createdAt: Date;
    private updatedAt: Date;
    private deletedAt?: Date;

    public setId(id: string): this {
        this.id = id;
        return this;
    }

    public setAmount(amount?: number): this {
        this.amount = amount;
        return this;
    }

    public setOperation(
        operation: (typeof TRANSACTION_OPERATION)[keyof typeof TRANSACTION_OPERATION],
    ): this {
        this.operation = operation;
        return this;
    }

    public setType(
        type?: (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE],
    ): this {
        this.type = type;
        return this;
    }

    public setState(
        state: (typeof TRANSACTION_STATE)[keyof typeof TRANSACTION_STATE],
    ): this {
        this.state = state;
        return this;
    }

    public setDescription(description: string): this {
        this.description = description;
        return this;
    }

    public setBankAccountId(bankAccountId: string): this {
        this.bankAccountId = bankAccountId;
        return this;
    }

    public setCorrelationId(correlationId?: string): this {
        this.correlationId = correlationId;
        return this;
    }

    public setSourceBank(sourceBank: string): this {
        this.sourceBank = sourceBank;
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

    public build(): Transaction {
        return new Transaction(
            this.id,
            this.operation,
            this.state,
            this.description,
            this.bankAccountId,
            this.createdAt,
            this.updatedAt,
            this.amount,
            this.type,
            this.correlationId,
            this.sourceBank,
            this.deletedAt,
        );
    }
}

export const TRANSACTION_OPERATION = {
    WITHDRAWAL: 'withdrawal',
    DEPOSIT: 'deposit',
    TRANSFER: 'transfer',
    BALANCE_INQUIRY: 'balance_inquiry',
    PIN_CHANGE: 'pin_change',
    REVERSAL: 'reversal',
    MINI_STATEMENT: 'mini_statement',
} as const;

export const TRANSACTION_TYPE = {
    DEBIT: 'debit',
    CREDIT: 'credit',
} as const;

export const TRANSACTION_STATE = {
    PENDING: 'pending',
    SUCCESS: 'success',
    CANCELLED: 'cancelled',
} as const;

export const ALLOWED_STATE_TRANSITIONS: Record<string, string[]> = {
    [TRANSACTION_STATE.PENDING]: [
        TRANSACTION_STATE.SUCCESS,
        TRANSACTION_STATE.CANCELLED,
    ],
    [TRANSACTION_STATE.SUCCESS]: [],
    [TRANSACTION_STATE.CANCELLED]: [],
};

export const NON_FINANCIAL_OPERATIONS: string[] = [
    TRANSACTION_OPERATION.BALANCE_INQUIRY,
    TRANSACTION_OPERATION.PIN_CHANGE,
    TRANSACTION_OPERATION.MINI_STATEMENT,
];

export class Transaction {
    @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    public readonly id: string;

    @ApiProperty({
        example: 5000,
        description: 'Amount in cents',
        required: false,
    })
    public readonly amount?: number;

    @ApiProperty({ enum: TRANSACTION_OPERATION })
    public readonly operation: (typeof TRANSACTION_OPERATION)[keyof typeof TRANSACTION_OPERATION];

    @ApiProperty({ enum: TRANSACTION_TYPE, required: false })
    public readonly type?: (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];

    @ApiProperty({ enum: TRANSACTION_STATE })
    public readonly state: (typeof TRANSACTION_STATE)[keyof typeof TRANSACTION_STATE];

    @ApiProperty({ example: 'ATM withdrawal' })
    public readonly description: string;

    @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    public readonly bankAccountId: string;

    @ApiProperty({
        example: '267c00a9-865e-4b6b-af47-c81a021cc038',
        required: false,
    })
    public readonly correlationId?: string;

    @ApiProperty({ example: 'bank_a', enum: ['bank_a', 'bank_b'] })
    public readonly sourceBank: string;

    @ApiProperty({ example: '2026-07-09T22:31:30.974Z' })
    public readonly createdAt: Date;

    @ApiProperty({ example: '2026-07-09T22:31:30.974Z' })
    public readonly updatedAt: Date;

    @ApiProperty({ required: false })
    public readonly deletedAt?: Date;

    public constructor(
        id: string,
        operation: (typeof TRANSACTION_OPERATION)[keyof typeof TRANSACTION_OPERATION],
        state: (typeof TRANSACTION_STATE)[keyof typeof TRANSACTION_STATE],
        description: string,
        bankAccountId: string,
        createdAt: Date,
        updatedAt: Date,
        amount?: number,
        type?: (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE],
        correlationId?: string,
        sourceBank: string = 'bank_a',
        deletedAt?: Date,
    ) {
        this.id = id;
        this.amount = amount;
        this.operation = operation;
        this.type = type;
        this.state = state;
        this.description = description;
        this.bankAccountId = bankAccountId;
        this.correlationId = correlationId;
        this.sourceBank = sourceBank;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
    }

    public static get Builder(): TransactionBuilder {
        return new TransactionBuilder();
    }
}
