import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiExtraModels,
    ApiOkResponse,
    ApiSecurity,
    ApiTags,
} from '@nestjs/swagger';
import {
    Body,
    Controller,
    DefaultValuePipe,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Query,
    UseGuards,
    UseInterceptors,
    Version,
} from '@nestjs/common';
import {
    CombinedAuthGuard,
    PermissionsGuard,
} from '@features/auth/presentation/auth-guards.index';
import { RequiresPermissions } from '@features/auth/presentation/permissions.decorator';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
    ResilienceInterceptor,
    ThrottleStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { CreateAccountCommand } from '../application/commands/create-account/command';
import { CreateAccountResponse } from '../application/commands/create-account/response.dto';
import { GetAccountsQuery } from '../application/queries/get-accounts/query';
import { GetAccountByIdQuery } from '../application/queries/get-account-by-id/query';
import { GetAccountByIdResponse } from '../application/queries/get-account-by-id/response.dto';
import { GetAccountsResponse } from '../application/queries/get-accounts/response.dto';
import { ApiResponseError } from '@shared/core/response/api-response-error';
import { ResponseMetadata } from '@core/response/api-response-metadata';
import { ResponseMetadataPagination } from '@core/response/api-response-metadata-pagination';

@ApiTags('Accounts')
@ApiBearerAuth()
@ApiSecurity('api-key')
@ApiExtraModels(
    ResponseMetadata,
    ResponseMetadataPagination,
    ApiResponseError,
    CreateAccountResponse,
    GetAccountsResponse,
    GetAccountByIdResponse,
)
@Controller('accounts')
@UseGuards(CombinedAuthGuard, PermissionsGuard)
@UseInterceptors(
    ResilienceInterceptor(
        new ThrottleStrategy({ ttl: 60_000, limit: 30 }),
        new TimeoutStrategy(30_000),
    ),
)
export class AccountsController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    @Version('1')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        description: 'Account created',
        type: CreateAccountResponse,
    })
    @RequiresPermissions('accounts:write')
    public async create(
        @Body() command: CreateAccountCommand,
    ): Promise<CreateAccountResponse> {
        return this.commandBus.execute<CreateAccountResponse>(command);
    }

    @Get()
    @Version('1')
    @ApiOkResponse({
        description: 'Accounts found',
        type: GetAccountsResponse,
    })
    @RequiresPermissions('accounts:read')
    public async list(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('agreement_id') agreementId?: string,
        @Query('type') type?: string,
        @Query('state') state?: string,
    ): Promise<GetAccountsResponse> {
        return this.queryBus.execute<GetAccountsResponse>(
            new GetAccountsQuery(page, limit, agreementId, type, state),
        );
    }

    @Get(':id')
    @Version('1')
    @ApiOkResponse({
        description: 'Account found',
        type: GetAccountByIdResponse,
    })
    @RequiresPermissions('accounts:read')
    public async getById(
        @Param('id') id: string,
    ): Promise<GetAccountByIdResponse> {
        return this.queryBus.execute<GetAccountByIdResponse>(
            new GetAccountByIdQuery(id),
        );
    }
}
