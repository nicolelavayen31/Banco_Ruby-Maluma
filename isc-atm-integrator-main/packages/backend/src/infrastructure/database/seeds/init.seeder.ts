import { runSeeders, Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import ProfileSeeder from './profile.seeder';
import AdminUserSeeder from './admin-user.seeder';
import AgreementSeeder from './agreement.seeder';
import BankAccountSeeder from './bank-account.seeder';
import bankAccountFactory from '../factories/bank-account.factory';
import agreementFactory from '../factories/agreement.factory';

export default class InitSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<void> {
        console.log('Starting database seed...');

        await runSeeders(dataSource, {
            seeds: [
                ProfileSeeder,
                AdminUserSeeder,
                AgreementSeeder,
                BankAccountSeeder,
            ],
            factories: [bankAccountFactory, agreementFactory],
        });

        console.log('Database seed complete.');
    }
}
