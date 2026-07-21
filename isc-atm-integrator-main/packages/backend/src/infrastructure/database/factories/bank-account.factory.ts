import { setSeederFactory } from 'typeorm-extension';
import { BankAccountEntity } from '@features/accounts/infrastructure/persistence/typeorm/account.entity';
import { randomUUID } from 'node:crypto';

export default setSeederFactory(BankAccountEntity, (faker) => {
    const account = new BankAccountEntity();
    account.id = randomUUID();
    account.reference = faker.string.numeric(10);
    account.type = faker.helpers.arrayElement(['savings', 'checking']);
    account.balance = faker.number.int({ min: 100000, max: 10000000 });
    account.state = 'active';
    account.createdAt = new Date();
    account.updatedAt = new Date();
    return account;
});
