import { ApiProperty } from '@nestjs/swagger';
import { IApiResponse } from '@core/response/api-response';
import type { IApiResponseMetadata } from '@core/response/api-response-metadata';
import { ResponseMetadata } from '@core/response/api-response-metadata';
import { Transaction } from '@features/transactions/domain/transaction';

export class GetTransactionsResponse implements IApiResponse<Transaction[]> {
    @ApiProperty({ type: () => Transaction, isArray: true })
    public readonly data: Transaction[];

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(data: Transaction[], metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }
}
