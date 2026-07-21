import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiSecurity,
    ApiTags,
} from '@nestjs/swagger';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
    Version,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { LoginCommand } from '../application/commands/login/command';
import { LoginResponse } from '../application/commands/login/response.dto';
import { RefreshCommand } from '../application/commands/refresh/command';
import { RefreshResponse } from '../application/commands/refresh/response.dto';
import { GenerateApiKeyCommand } from '../application/commands/generate-api-key/command';
import { GenerateApiKeyResponse } from '../application/commands/generate-api-key/response.dto';
import { RevokeApiKeyCommand } from '../application/commands/revoke-api-key/command';
import { RevokeApiKeyResponse } from '../application/commands/revoke-api-key/response.dto';
import { GetApiKeysQuery } from '../application/queries/get-api-keys/query';
import { GetApiKeysResponse } from '../application/queries/get-api-keys/response.dto';
import { JwtAuthGuard } from '../passport/guards/jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { RequiresPermissions } from './permissions.decorator';
import type { Request, Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post('login')
    @Version('1')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiBody({ type: LoginCommand })
    @ApiResponse({
        status: 200,
        description: 'Login successful',
        type: LoginResponse,
    })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    public async login(
        @Body() command: LoginCommand,
        @Res({ passthrough: true }) res: Response,
    ): Promise<LoginResponse> {
        const result = await this.commandBus.execute<LoginResponse>(command);

        res.cookie('__Host-refresh-token', result.data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/auth',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return result;
    }

    @Post('refresh')
    @Version('1')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token using refresh cookie' })
    @ApiResponse({
        status: 200,
        description: 'Token refreshed',
        type: RefreshResponse,
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid or expired refresh token',
    })
    public async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<RefreshResponse> {
        const refreshToken = req.cookies?.['__Host-refresh-token'] ?? '';

        const result = await this.commandBus.execute<RefreshResponse>(
            new RefreshCommand(refreshToken),
        );

        res.cookie('__Host-refresh-token', result.data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/auth',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return result;
    }

    @Post('api-keys')
    @Version('1')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth()
    @ApiSecurity('api-key')
    @RequiresPermissions('api_keys:write')
    @ApiOperation({ summary: 'Generate an API key for an agreement' })
    @ApiBody({ type: GenerateApiKeyCommand })
    @ApiResponse({
        status: 201,
        description: 'API key generated',
        type: GenerateApiKeyResponse,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Agreement not found' })
    public async generateApiKey(
        @Body() command: GenerateApiKeyCommand,
    ): Promise<GenerateApiKeyResponse> {
        return this.commandBus.execute<GenerateApiKeyResponse>(command);
    }

    @Get('api-keys')
    @Version('1')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @ApiBearerAuth()
    @ApiSecurity('api-key')
    @RequiresPermissions('api_keys:read')
    @ApiOperation({ summary: 'List API keys for an agreement' })
    @ApiResponse({
        status: 200,
        description: 'API keys found',
        type: GetApiKeysResponse,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    public async listApiKeys(
        @Query('agreement_id') agreementId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ): Promise<GetApiKeysResponse> {
        return this.queryBus.execute<GetApiKeysResponse>(
            new GetApiKeysQuery(agreementId, page ?? 1, limit ?? 10),
        );
    }

    @Delete('api-keys/:id')
    @Version('1')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @ApiBearerAuth()
    @ApiSecurity('api-key')
    @RequiresPermissions('api_keys:write')
    @ApiOperation({ summary: 'Revoke an API key' })
    @ApiResponse({
        status: 200,
        description: 'API key revoked',
        type: RevokeApiKeyResponse,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'API key not found' })
    public async revokeApiKey(
        @Param('id') id: string,
    ): Promise<RevokeApiKeyResponse> {
        return this.commandBus.execute<RevokeApiKeyResponse>(
            new RevokeApiKeyCommand(id),
        );
    }
}
