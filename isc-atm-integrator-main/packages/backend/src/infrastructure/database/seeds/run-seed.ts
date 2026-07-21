import { dataSource } from '../data-source';
import { runSeeders } from 'typeorm-extension';

async function bootstrap() {
    await dataSource.initialize();
    await runSeeders(dataSource);
    await dataSource.destroy();
}

void bootstrap();
