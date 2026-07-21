import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Command } from '@nestjs/cqrs';
import type { RefreshResponse } from './response.dto';

export class RefreshCommand extends Command<RefreshResponse> {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    public readonly refreshToken: string;

    public constructor(refreshToken: string) {
        super();
        this.refreshToken = refreshToken;
    }
}
