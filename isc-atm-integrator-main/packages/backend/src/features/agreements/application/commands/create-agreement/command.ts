import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Command } from '@nestjs/cqrs';
import type { CreateAgreementResponse } from './response.dto';

export class CreateAgreementCommand extends Command<CreateAgreementResponse> {
    @ApiProperty({ example: 'Banco Nacional', description: 'Institution name' })
    @IsString()
    @IsNotEmpty()
    public readonly name!: string;

    @ApiProperty({ example: 'BN-001', description: 'Agreement reference' })
    @IsString()
    @IsNotEmpty()
    public readonly reference!: string;
}
