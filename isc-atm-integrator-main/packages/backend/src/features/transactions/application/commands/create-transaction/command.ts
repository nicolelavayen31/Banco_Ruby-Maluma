import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';
import { Command } from '@nestjs/cqrs';
import type { CreateTransactionResponse } from './response.dto';
import {
    TRANSACTION_OPERATION,
    TRANSACTION_TYPE,
} from '@features/transactions/domain/transaction';

export class CreateTransactionCommand extends Command<CreateTransactionResponse> {
    @ApiProperty({
        example: 5000,
        description: 'Amount in cents',
        required: false,
    })
    @IsOptional()
    public readonly amount?: number;

    @ApiProperty({
        enum: TRANSACTION_OPERATION,
        example: 'withdrawal',
        description: 'ATM operation',
    })
    @IsEnum(TRANSACTION_OPERATION)
    public readonly operation!: (typeof TRANSACTION_OPERATION)[keyof typeof TRANSACTION_OPERATION];

    @ApiProperty({
        enum: TRANSACTION_TYPE,
        example: 'debit',
        required: false,
        description: 'DEBIT or CREDIT, null for non-financial ops',
    })
    @IsOptional()
    @IsEnum(TRANSACTION_TYPE)
    public readonly type?: (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];

    @ApiProperty({
        example: 'ATM withdrawal',
        description: 'Transaction description',
    })
    @IsString()
    @IsNotEmpty()
    public readonly description!: string;

    @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    @IsUUID()
    @IsNotEmpty()
    public readonly account_id!: string;

    @ApiProperty({ required: false, example: 'bank_a', enum: ['bank_a', 'bank_b'] })
    @IsOptional()
    @IsString()
    public readonly source_bank?: string;

    @ApiProperty({ required: false, example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    @IsOptional()
    @IsUUID()
    public readonly correlation_id?: string;
}
