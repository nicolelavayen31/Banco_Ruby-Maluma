import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TRANSACTION_STATE } from '@features/transactions/domain/transaction';

export class UpdateTransactionStateDto {
    @ApiProperty({
        enum: TRANSACTION_STATE,
        example: 'success',
        description: 'The new state for the transaction',
    })
    @IsEnum(TRANSACTION_STATE)
    public readonly state: (typeof TRANSACTION_STATE)[keyof typeof TRANSACTION_STATE];
}
