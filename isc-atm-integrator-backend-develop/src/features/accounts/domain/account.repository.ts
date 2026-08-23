import { BankAccountEntity } from '../infrastructure/persistence/typeorm/account.entity';
import { BankAccount } from './account';

export const BANK_ACCOUNT_REPOSITORY = Symbol('BANK_ACCOUNT_REPOSITORY');

export interface IBankAccountRepository {
    save(account: BankAccount): Promise<BankAccountEntity>;
    findById(id: string): Promise<BankAccountEntity | null>;
    findAll(
        page: number,
        limit: number,
        agreementId?: string,
        type?: string,
        state?: string,
    ): Promise<{
        items: BankAccountEntity[];
        total: number;
        page: number;
        limit: number;
    }>;
}
