import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Command } from '@nestjs/cqrs';
import type { TransferResponse } from './response.dto';

export class TransferCommand extends Command<TransferResponse> {
    @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    @IsUUID()
    @IsNotEmpty()
    public readonly from_account_id!: string;

    @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc039' })
    @IsUUID()
    @IsNotEmpty()
    public readonly to_account_id!: string;

    @ApiProperty({ example: 5000, description: 'Amount in cents' })
    @Min(1)
    public readonly amount!: number;

    @ApiProperty({ example: 'Transfer between accounts' })
    @IsString()
    @IsNotEmpty()
    public readonly description!: string;

    @ApiProperty({ required: false, example: 'bank_a', enum: ['bank_a', 'bank_b'] })
    @IsOptional()
    @IsString()
    public readonly source_bank?: string;

    @ApiProperty({ required: false, example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    @IsOptional()
    @IsUUID()
    public readonly correlation_id?: string;
}
