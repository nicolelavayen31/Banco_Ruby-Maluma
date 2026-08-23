import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Command } from '@nestjs/cqrs';
import type { CreateOrderResponse } from './response.dto';

export class CreateOrderCommand extends Command<CreateOrderResponse> {
    @ApiProperty({ example: 'Alice', description: 'Customer name' })
    @IsString()
    @IsNotEmpty()
    public readonly name!: string;

    @ApiProperty({ example: 100, description: 'Order amount' })
    @IsNumber()
    @Min(0.01)
    public readonly pricing!: number;
}
