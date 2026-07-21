import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Command } from '@nestjs/cqrs';
import type { GenerateApiKeyResponse } from './response.dto';

export class GenerateApiKeyCommand extends Command<GenerateApiKeyResponse> {
    @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    @IsUUID()
    @IsNotEmpty()
    public readonly agreement_id!: string;

    @ApiProperty({ example: 'ATM-North-01' })
    @IsString()
    @IsNotEmpty()
    public readonly name!: string;

    @ApiProperty({
        example: '267c00a9-865e-4b6b-af47-c81a021cc038',
        required: false,
    })
    @IsUUID()
    @IsOptional()
    public readonly profile_id?: string;
}
