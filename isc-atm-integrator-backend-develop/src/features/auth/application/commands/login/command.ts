import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Command } from '@nestjs/cqrs';
import type { LoginResponse } from './response.dto';

export class LoginCommand extends Command<LoginResponse> {
    @ApiProperty({ example: 'admin@atm-integrator.local' })
    @IsEmail()
    @IsNotEmpty()
    public readonly email!: string;

    @ApiProperty({ example: 'admin123' })
    @IsString()
    @IsNotEmpty()
    public readonly password!: string;
}
