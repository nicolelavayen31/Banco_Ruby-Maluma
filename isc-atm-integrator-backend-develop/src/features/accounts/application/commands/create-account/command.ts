import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Command } from '@nestjs/cqrs';
import type { CreateAccountResponse } from './response.dto';
import { ACCOUNT_TYPE } from '@features/accounts/domain/account';

export class CreateAccountCommand extends Command<CreateAccountResponse> {
    @ApiProperty({ example: 'ACC-001', description: 'Account number' })
    @IsString()
    @IsNotEmpty()
    public readonly reference!: string;

    @ApiProperty({
        enum: ACCOUNT_TYPE,
        example: 'savings',
        description: 'Account type',
    })
    @IsEnum(ACCOUNT_TYPE)
    public readonly type!: (typeof ACCOUNT_TYPE)[keyof typeof ACCOUNT_TYPE];

    @ApiProperty({
        example: '267c00a9-865e-4b6b-af47-c81a021cc038',
        description: 'Agreement ID',
    })
    @IsUUID()
    @IsNotEmpty()
    public readonly agreement_id!: string;
}
