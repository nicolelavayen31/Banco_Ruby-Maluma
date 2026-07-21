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
    Patch,
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
import { CreateTransactionCommand } from '../application/commands/create-transaction/command';
import { CreateTransactionResponse } from '../application/commands/create-transaction/response.dto';
import { TransferCommand } from '../application/commands/transfer/command';
import { TransferResponse } from '../application/commands/transfer/response.dto';
import { UpdateTransactionStateCommand } from '../application/commands/update-transaction-state/command';
import { UpdateTransactionStateResponse } from '../application/commands/update-transaction-state/response.dto';
import { GetTransactionsQuery } from '../application/queries/get-transactions/query';
import { GetTransactionByIdQuery } from '../application/queries/get-transaction-by-id/query';
import { GetTransactionByIdResponse } from '../application/queries/get-transaction-by-id/response.dto';
import { TRANSACTION_STATE } from '../domain/transaction';
import { GetTransactionsResponse } from '../application/queries/get-transactions/response.dto';
import { ApiResponseError } from '@shared/core/response/api-response-error';
import { ResponseMetadata } from '@core/response/api-response-metadata';
import { ResponseMetadataPagination } from '@core/response/api-response-metadata-pagination';

@ApiTags('Transactions')
@ApiBearerAuth()
@ApiSecurity('api-key')
@ApiExtraModels(
    ResponseMetadata,
    ResponseMetadataPagination,
    ApiResponseError,
    CreateTransactionResponse,
    TransferResponse,
    UpdateTransactionStateResponse,
    GetTransactionsResponse,
    GetTransactionByIdResponse,
)
@Controller('transactions')
@UseGuards(CombinedAuthGuard, PermissionsGuard)
@UseInterceptors(
    ResilienceInterceptor(
        new ThrottleStrategy({ ttl: 60_000, limit: 30 }),
        new TimeoutStrategy(30_000),
    ),
)
export class TransactionsController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    @Version('1')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        description: 'Transaction created',
        type: CreateTransactionResponse,
    })
    @RequiresPermissions('transactions:write')
    public async create(
        @Body() command: CreateTransactionCommand,
    ): Promise<CreateTransactionResponse> {
        return this.commandBus.execute<CreateTransactionResponse>(command);
    }

    @Post('transfer')
    @Version('1')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        description: 'Transfer completed',
        type: TransferResponse,
    })
    @RequiresPermissions('transactions:write')
    public async transfer(
        @Body() command: TransferCommand,
    ): Promise<TransferResponse> {
        return this.commandBus.execute<TransferResponse>(command);
    }

    @Patch(':id/state')
    @Version('1')
    @ApiOkResponse({
        description: 'Transaction state updated',
        type: UpdateTransactionStateResponse,
    })
    @RequiresPermissions('transactions:write')
    public async updateState(
        @Param('id') id: string,
        @Body('state') state: string,
    ): Promise<UpdateTransactionStateResponse> {
        return this.commandBus.execute<UpdateTransactionStateResponse>(
            new UpdateTransactionStateCommand(
                id,
                state as (typeof TRANSACTION_STATE)[keyof typeof TRANSACTION_STATE],
            ),
        );
    }

    @Get()
    @Version('1')
    @ApiOkResponse({
        description: 'Transactions found',
        type: GetTransactionsResponse,
    })
    @RequiresPermissions('transactions:read')
    public async list(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('account_id') accountId?: string,
        @Query('correlation_id') correlationId?: string,
        @Query('operation') operation?: string,
        @Query('state') state?: string,
    ): Promise<GetTransactionsResponse> {
        return this.queryBus.execute<GetTransactionsResponse>(
            new GetTransactionsQuery(
                page,
                limit,
                accountId,
                correlationId,
                operation,
                state,
            ),
        );
    }

    @Get(':id')
    @Version('1')
    @ApiOkResponse({
        description: 'Transaction found',
        type: GetTransactionByIdResponse,
    })
    @RequiresPermissions('transactions:read')
    public async getById(
        @Param('id') id: string,
    ): Promise<GetTransactionByIdResponse> {
        return this.queryBus.execute<GetTransactionByIdResponse>(
            new GetTransactionByIdQuery(id),
        );
    }
}
