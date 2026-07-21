import { BankAccount } from '@features/accounts/domain/account';
import { ApiProperty } from '@nestjs/swagger';
import type { IApiResponse } from '@shared/core/response/api-response';
import {
    type IApiResponseMetadata,
    ResponseMetadata,
} from '@shared/core/response/api-response-metadata';

export class GetAccountByIdResponse implements IApiResponse<BankAccount> {
    @ApiProperty({ type: () => BankAccount })
    public readonly data: BankAccount;

    @ApiProperty({ type: () => ResponseMetadata })
    public readonly metadata: IApiResponseMetadata;

    constructor(data: BankAccount, metadata: IApiResponseMetadata) {
        this.data = data;
        this.metadata = metadata;
    }
}
