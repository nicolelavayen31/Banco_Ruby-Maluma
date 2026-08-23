import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';
import { AgreementEntity } from '@features/agreements/infrastructure/persistence/typeorm/agreement.entity';

interface BankSeed {
    name: string;
    apiUrl: string;
    authType: 'jwt' | 'api_key';
    authConfig: Record<string, any>;
}

const ECUADORIAN_BANKS: BankSeed[] = [
    {
        name: 'Banco Pichincha',
        apiUrl: 'https://api.bancopichincha.com/webhook',
        authType: 'jwt',
        authConfig: { secret: 'pichincha-jwt-secret' },
    },
    {
        name: 'Banco del Pacífico',
        apiUrl: 'https://api.bancopacifico.com/webhook',
        authType: 'api_key',
        authConfig: { key: 'pacifico-api-key-123' },
    },
    {
        name: 'Produbanco',
        apiUrl: 'https://api.produbanco.com/webhook',
        authType: 'jwt',
        authConfig: { secret: 'produbanco-jwt-secret' },
    },
    {
        name: 'Banco de Guayaquil',
        apiUrl: 'https://api.bancoguayaquil.com/webhook',
        authType: 'api_key',
        authConfig: { key: 'guayaquil-api-key-456' },
    },
    {
        name: 'Banco Internacional',
        apiUrl: 'https://api.bancointernacional.com/webhook',
        authType: 'jwt',
        authConfig: { secret: 'internacional-jwt-secret' },
    },
    {
        name: 'Banco Bolivariano',
        apiUrl: 'https://api.bancobolivariano.com/webhook',
        authType: 'api_key',
        authConfig: { key: 'bolivariano-api-key-789' },
    },
    {
        name: 'Banco Solidario',
        apiUrl: 'https://api.bancosolidario.com/webhook',
        authType: 'jwt',
        authConfig: { secret: 'solidario-jwt-secret' },
    },
    {
        name: 'Banco de Loja',
        apiUrl: 'https://api.bancodeloja.com/webhook',
        authType: 'api_key',
        authConfig: { key: 'loja-api-key-012' },
    },
    {
        name: 'Banco del Austro',
        apiUrl: 'https://api.bancodelaustro.com/webhook',
        authType: 'jwt',
        authConfig: { secret: 'austro-jwt-secret' },
    },
    {
        name: 'Banco Rumiñahui',
        apiUrl: 'https://api.ruminahui.com/webhook',
        authType: 'api_key',
        authConfig: { key: 'ruminahui-api-key-345' },
    },
    {
        name: 'Banco General Rumiñahui',
        apiUrl: 'https://api.gr.com/webhook',
        authType: 'jwt',
        authConfig: { secret: 'gr-jwt-secret' },
    },
    {
        name: 'Banco Amazonas',
        apiUrl: 'https://api.bancoamazonas.com/webhook',
        authType: 'api_key',
        authConfig: { key: 'amazonas-api-key-678' },
    },
    {
        name: 'Banco del Litoral',
        apiUrl: 'https://api.bancolitoral.com/webhook',
        authType: 'jwt',
        authConfig: { secret: 'litoral-jwt-secret' },
    },
    {
        name: 'Banco Comercial de Manabí',
        apiUrl: 'https://api.manabi.com/webhook',
        authType: 'api_key',
        authConfig: { key: 'manabi-api-key-901' },
    },
    {
        name: 'Banco D-MIRO',
        apiUrl: 'https://api.dmiro.com/webhook',
        authType: 'jwt',
        authConfig: { secret: 'dmiro-jwt-secret' },
    },
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

        const agreements = ECUADORIAN_BANKS.map((bank) => ({
            id: randomUUID(),
            name: bank.name,
            reference: faker.string.alphanumeric(8).toUpperCase(),
            state: 'active',
            apiUrl: bank.apiUrl,
            authType: bank.authType,
            authConfig: bank.authConfig,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        await repo.save(agreements);
        console.log(`Seeded ${agreements.length} agreements.`);
    }
}
