import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BankApiClient } from './bank-api.client';

@Module({
    imports: [HttpModule],
    providers: [BankApiClient],
    exports: [BankApiClient],
})
export class BankApiModule {}
