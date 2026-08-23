import { setSeederFactory } from 'typeorm-extension';
import { AgreementEntity } from '@features/agreements/infrastructure/persistence/typeorm/agreement.entity';
import { randomUUID } from 'node:crypto';

const AUTH_TYPES = ['jwt', 'api_key'] as const;

export default setSeederFactory(AgreementEntity, (faker) => {
    const authType = faker.helpers.arrayElement([...AUTH_TYPES]);
    const agreement = new AgreementEntity();
    agreement.id = randomUUID();
    agreement.name = `${faker.company.name()} Bank`;
    agreement.reference = faker.string.alphanumeric(8).toUpperCase();
    agreement.state = 'active';
    agreement.apiUrl = faker.internet.url();
    agreement.authType = authType;
    agreement.authConfig =
        authType === 'jwt'
            ? { secret: faker.string.alphanumeric(32) }
            : { key: faker.string.alphanumeric(24) };
    agreement.createdAt = new Date();
    agreement.updatedAt = new Date();
    return agreement;
});
