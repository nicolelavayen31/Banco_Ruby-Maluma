import { IBankAccountRepository } from '../../../../domain/account.repository';
import { BankAccountEntity } from '../../typeorm/account.entity';
import { BankAccount } from '../../../../domain/account';

export class InMemoryBankAccountRepository implements IBankAccountRepository {
    private accounts: Map<string, BankAccountEntity> = new Map();

    public async save(account: BankAccount): Promise<BankAccountEntity> {
        const entity = new BankAccountEntity();
        entity.id = account.id;
        entity.reference = account.reference;
        entity.type = account.type;
        entity.balance = account.balance;
        entity.state = account.state;
        entity.agreementId = account.agreementId;
        entity.createdAt = account.createdAt;
        entity.updatedAt = account.updatedAt;
        entity.deletedAt = account.deletedAt;
        this.accounts.set(entity.id, entity);
        return entity;
    }

    public async findById(id: string): Promise<BankAccountEntity | null> {
        return this.accounts.get(id) ?? null;
    }

    public async findAll(
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
    }> {
        let all = Array.from(this.accounts.values());
        if (agreementId) all = all.filter((a) => a.agreementId === agreementId);
        if (type) all = all.filter((a) => a.type === type);
        if (state) all = all.filter((a) => a.state === state);
        const start = (page - 1) * limit;
        const items = all.slice(start, start + limit);
        return { items, total: all.length, page, limit };
    }

    public seed(accounts: BankAccount[]): void {
        for (const a of accounts) {
            const entity = new BankAccountEntity();
            entity.id = a.id;
            entity.reference = a.reference;
            entity.type = a.type;
            entity.balance = a.balance;
            entity.state = a.state;
            entity.agreementId = a.agreementId;
            entity.createdAt = a.createdAt;
            entity.updatedAt = a.updatedAt;
            entity.deletedAt = a.deletedAt;
            this.accounts.set(entity.id, entity);
        }
    }

    public reset(): void {
        this.accounts.clear();
    }
}
