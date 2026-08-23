import { dataSource } from '../data-source';
import { runSeeders } from 'typeorm-extension';
import ProfileSeeder from './profile.seeder';
import AgreementSeeder from './agreement.seeder';
import AdminUserSeeder from './admin-user.seeder';
import BankAccountSeeder from './bank-account.seeder';
import bankAccountFactory from '../factories/bank-account.factory';
import agreementFactory from '../factories/agreement.factory';

async function bootstrap() {
    await dataSource.initialize();
    await runSeeders(dataSource, {
        seeds: [
            ProfileSeeder,
            AgreementSeeder,
            AdminUserSeeder,
            BankAccountSeeder,
        ],
        factories: [bankAccountFactory, agreementFactory],
    });
    await dataSource.destroy();
}

void bootstrap();
