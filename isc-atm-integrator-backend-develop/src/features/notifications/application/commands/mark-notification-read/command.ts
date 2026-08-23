import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { Command } from '@nestjs/cqrs';
import { MarkNotificationReadResponse } from './response.dto';

export class MarkNotificationReadCommand extends Command<MarkNotificationReadResponse> {
    @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    @IsUUID()
    public readonly id!: string;

    constructor(id: string) {
        super();
        this.id = id;
    }
}
