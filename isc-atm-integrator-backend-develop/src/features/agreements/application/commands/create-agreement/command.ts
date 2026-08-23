import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Command } from '@nestjs/cqrs';
import type { CreateAgreementResponse } from './response.dto';
import type { AuthType } from '@features/agreements/domain/agreement';

export class CreateAgreementCommand extends Command<CreateAgreementResponse> {
    @ApiProperty({ example: 'Banco Nacional', description: 'Institution name' })
    @IsString()
    @IsNotEmpty()
    public readonly name!: string;

    @ApiProperty({ example: 'BN-001', description: 'Agreement reference' })
    @IsString()
    @IsNotEmpty()
    public readonly reference!: string;

    @ApiProperty({ example: 'https://bank-a.api.com/webhook', required: false })
    @IsString()
    @IsOptional()
    public readonly apiUrl?: string;

    @ApiProperty({ enum: ['jwt', 'api_key'], required: false })
    @IsString()
    @IsOptional()
    public readonly authType?: AuthType;

    @ApiProperty({ required: false, description: 'Auth config JSON' })
    @IsOptional()
    public readonly authConfig?: Record<string, any>;
}
