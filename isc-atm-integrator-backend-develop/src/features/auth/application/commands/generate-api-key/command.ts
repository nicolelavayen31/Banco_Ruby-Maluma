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

    @ApiProperty({
        example: '0fefe2be-182f-47f0-bc95-c36fa6cac471',
        description: 'User ID of the person creating the API key',
    })
    @IsUUID()
    @IsNotEmpty()
    public readonly created_by_id!: string;
}
