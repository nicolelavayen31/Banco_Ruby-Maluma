import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';
import { AgreementEntity } from '@features/agreements/infrastructure/persistence/typeorm/agreement.entity';
import { BankAccountEntity } from '@features/accounts/infrastructure/persistence/typeorm/account.entity';

export default class BankAccountSeeder implements Seeder {
    public async run(
        dataSource: DataSource,
        _factoryManager: SeederFactoryManager,
    ): Promise<void> {
        const accountRepo = dataSource.getRepository(BankAccountEntity);
        const agreementRepo = dataSource.getRepository(AgreementEntity);

        const count = await accountRepo.count();
        if (count > 0) {
            console.log('Bank accounts already exist. Skipping.');
            return;
        }

        const agreements = await agreementRepo.find();
        if (agreements.length === 0) {
            console.warn('No agreements found. Skipping bank account seed.');
            return;
        }

        const types = ['savings', 'checking'];
        const accounts: BankAccountEntity[] = [];

        for (const agreement of agreements) {
            const num = faker.number.int({ min: 1, max: 3 });
            for (let i = 0; i < num; i++) {
                const account = new BankAccountEntity();
                account.id = randomUUID();
                account.reference = faker.string.numeric(10);
                account.type = faker.helpers.arrayElement(types);
                account.balance = faker.number.int({
                    min: 100000,
                    max: 10000000,
                });
                account.state = 'active';
                account.agreementId = agreement.id;
                account.createdAt = new Date();
                account.updatedAt = new Date();
                accounts.push(account);
            }
        }

        await accountRepo.save(accounts);
        console.log(`Seeded ${accounts.length} bank accounts.`);
    }
}
