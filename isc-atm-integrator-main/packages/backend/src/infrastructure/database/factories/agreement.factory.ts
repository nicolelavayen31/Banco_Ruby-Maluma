import { setSeederFactory } from 'typeorm-extension';
import { AgreementEntity } from '@features/agreements/infrastructure/persistence/typeorm/agreement.entity';
import { randomUUID } from 'node:crypto';

export default setSeederFactory(AgreementEntity, (faker) => {
    const agreement = new AgreementEntity();
    agreement.id = randomUUID();
    agreement.name = `${faker.company.name()} Bank`;
    agreement.reference = faker.string.alphanumeric(8).toUpperCase();
    agreement.state = 'active';
    agreement.createdAt = new Date();
    agreement.updatedAt = new Date();
    return agreement;
});
