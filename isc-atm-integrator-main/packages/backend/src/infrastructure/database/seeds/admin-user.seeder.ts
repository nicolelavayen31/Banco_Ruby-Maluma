import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { AuthUserEntity } from '@features/auth/infrastructure/persistence/typeorm/auth-user.entity';
import { AuthProfileEntity } from '@features/auth/infrastructure/persistence/typeorm/auth-profile.entity';
import { UserProfileEntity } from '@features/auth/infrastructure/persistence/typeorm/user-profile.entity';
import { AgreementEntity } from '@features/agreements/infrastructure/persistence/typeorm/agreement.entity';

export default class AdminUserSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<void> {
        const userRepo = dataSource.getRepository(AuthUserEntity);
        const profileRepo = dataSource.getRepository(AuthProfileEntity);
        const upRepo = dataSource.getRepository(UserProfileEntity);

        const email =
            process.env.APP_SEED_ADMIN_EMAIL ?? 'admin@atm-integrator.local';
        const existing = await userRepo.findOneBy({ email });
        if (existing) {
            console.log(`Admin user already exists (${email}). Skipping.`);
            return;
        }

        const adminProfile = await profileRepo.findOneBy({ name: 'admin' });
        if (!adminProfile) {
            console.warn('Admin profile not found. Run ProfileSeeder first.');
            return;
        }

        const agreementRepo = dataSource.getRepository(AgreementEntity);
        const agreement = await agreementRepo.findOne({ where: {} });
        if (!agreement) {
            console.warn('No agreements found. Skipping admin user seed.');
            return;
        }

        const password = process.env.APP_SEED_ADMIN_PASSWORD ?? 'admin123';
        const passwordHash = await bcrypt.hash(password, 12);

        const user = await userRepo.save({
            id: randomUUID(),
            email,
            passwordHash,
            name: 'System Admin',
            state: 'active',
            agreementId: agreement.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await upRepo.save({
            userId: user.id,
            profileId: adminProfile.id,
        });

        console.log(`Admin user created: ${email}`);
        console.log(`Admin password: ${password}`);
    }
}
