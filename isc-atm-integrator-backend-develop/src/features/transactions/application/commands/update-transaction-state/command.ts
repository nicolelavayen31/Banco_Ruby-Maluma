import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { Command } from '@nestjs/cqrs';
import type { UpdateTransactionStateResponse } from './response.dto';
import { TRANSACTION_STATE } from '@features/transactions/domain/transaction';

export class UpdateTransactionStateCommand extends Command<UpdateTransactionStateResponse> {
    @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    @IsUUID()
    @IsNotEmpty()
    public readonly id: string;

    @ApiProperty({ enum: TRANSACTION_STATE, example: 'success' })
    @IsEnum(TRANSACTION_STATE)
    public readonly state: (typeof TRANSACTION_STATE)[keyof typeof TRANSACTION_STATE];

    public constructor(
        id: string,
        state: (typeof TRANSACTION_STATE)[keyof typeof TRANSACTION_STATE],
    ) {
        super();
        this.id = id;
        this.state = state;
    }
}
