import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { Command } from '@nestjs/cqrs';
import type { RevokeApiKeyResponse } from './response.dto';

export class RevokeApiKeyCommand extends Command<RevokeApiKeyResponse> {
    @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    @IsUUID()
    @IsNotEmpty()
    public readonly id: string;

    public constructor(id: string) {
        super();
        this.id = id;
    }
}
