import { ApiProperty } from '@nestjs/swagger';
import { IApiResponse } from '@core/response/api-response';
import type { IApiResponseMetadata } from '@core/response/api-response-metadata';
import { ResponseMetadata } from '@core/response/api-response-metadata';
import { BankAccount } from '@features/accounts/domain/account';

export class GetAccountsResponse implements IApiResponse<BankAccount[]> {
    @ApiProperty({ type: () => BankAccount, isArray: true })
    public readonly data: BankAccount[];

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(data: BankAccount[], metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }
}
