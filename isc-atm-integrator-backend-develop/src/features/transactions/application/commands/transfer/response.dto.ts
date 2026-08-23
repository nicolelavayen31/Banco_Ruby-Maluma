import { Transaction } from '@features/transactions/domain/transaction';
import { ApiProperty } from '@nestjs/swagger';
import { IApiResponse } from '@shared/core/response/api-response';
import {
    type IApiResponseMetadata,
    ResponseMetadata,
} from '@shared/core/response/api-response-metadata';

export class TransferResponse implements IApiResponse<Transaction[]> {
    @ApiProperty({ type: () => Transaction, isArray: true })
    public readonly data: Transaction[];

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(data: Transaction[], metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }
}
