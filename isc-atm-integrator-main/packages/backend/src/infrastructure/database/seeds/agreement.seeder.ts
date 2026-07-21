import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';
import { AgreementEntity } from '@features/agreements/infrastructure/persistence/typeorm/agreement.entity';

const ECUADORIAN_BANKS = [
    'Banco Pichincha',
    'Banco del Pacífico',
    'Produbanco',
    'Banco de Guayaquil',
    'Banco Internacional',
    'Banco Bolivariano',
    'Banco Solidario',
    'Banco de Loja',
    'Banco del Austro',
    'Banco Rumiñahui',
    'Banco General Rumiñahui',
    'Banco Amazonas',
    'Banco del Litoral',
    'Banco Comercial de Manabí',
    'Banco D-MIRO',
] as const;

export default class AgreementSeeder implements Seeder {
    public async run(
        dataSource: DataSource,
        _factoryManager: SeederFactoryManager,
    ): Promise<void> {
        const repo = dataSource.getRepository(AgreementEntity);
        const count = await repo.count();
        if (count > 0) {
            console.log('Agreements already exist. Skipping.');
            return;
        }

        const agreements = ECUADORIAN_BANKS.map((name) => ({
            id: randomUUID(),
            name,
            reference: faker.string.alphanumeric(8).toUpperCase(),
            state: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        await repo.save(agreements);
        console.log(`Seeded ${agreements.length} agreements.`);
    }
}
