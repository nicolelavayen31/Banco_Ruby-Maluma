import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { CONCILIATION_REPOSITORY } from '../src/features/conciliation/domain/conciliation.repository';
import { TRANSACTION_REPOSITORY } from '../src/features/transactions/domain/transaction.repository';
import { BANK_ACCOUNT_REPOSITORY } from '../src/features/accounts/domain/account.repository';
import { AUTH_USER_REPOSITORY } from '../src/features/auth/domain/auth-user.repository';
import { AUTH_REFRESH_TOKEN_REPOSITORY } from '../src/features/auth/domain/auth-refresh-token.repository';
import { InMemoryConciliationRepository } from '../src/features/conciliation/infrastructure/persistence/__tests__/in-memory/conciliation.repository';
import { InMemoryTransactionRepository } from '../src/features/transactions/infrastructure/persistence/__tests__/in-memory/transaction.repository';
import { InMemoryBankAccountRepository } from '../src/features/accounts/infrastructure/persistence/__tests__/in-memory/bank-account.repository';
import { InMemoryAuthUserRepository } from '../src/features/auth/infrastructure/persistence/__tests__/in-memory/auth-user.repository';
import { InMemoryAuthRefreshTokenRepository } from '../src/features/auth/infrastructure/persistence/__tests__/in-memory/auth-refresh-token.repository';
import { AuthUser, AUTH_USER_STATE } from '../src/features/auth/domain/auth-user';
import { BankAccount, ACCOUNT_TYPE, ACCOUNT_STATE } from '../src/features/accounts/domain/account';
import * as bcrypt from 'bcryptjs';

process.env.APP_CSRF_ENABLED = 'false';
process.env.DB_TYPE = 'pglite';

describe('Conciliation Flow (E2E)', () => {
    let app: INestApplication;
    let conciliationRepo: InMemoryConciliationRepository;
    let txRepo: InMemoryTransactionRepository;
    let accountRepo: InMemoryBankAccountRepository;
    let userRepo: InMemoryAuthUserRepository;
    let refreshTokenRepo: InMemoryAuthRefreshTokenRepository;

    let jwtToken: string;
    let accountId: string;
    const API_PREFIX = '/api';

    beforeAll(async () => {
        conciliationRepo = new InMemoryConciliationRepository();
        txRepo = new InMemoryTransactionRepository();
        accountRepo = new InMemoryBankAccountRepository();
        userRepo = new InMemoryAuthUserRepository();
        refreshTokenRepo = new InMemoryAuthRefreshTokenRepository();

        const userId = '550e8400-e29b-41d4-a716-446655440001';
        const agreementId = '550e8400-e29b-41d4-a716-446655440002';
        accountId = '550e8400-e29b-41d4-a716-446655440003';

        const passwordHash = await bcrypt.hash('admin123', 4);
        userRepo.seed([
            AuthUser.Builder
                .setId(userId)
                .setEmail('admin@e2e.test')
                .setPasswordHash(passwordHash)
                .setName('E2E Admin')
                .setState(AUTH_USER_STATE.ACTIVE)
                .setAgreementId(agreementId)
                .setCreatedAt(new Date())
                .setUpdatedAt(new Date())
                .build(),
        ], { [userId]: ['accounts:read', 'accounts:write', 'transactions:read', 'transactions:write'] });

        accountRepo.seed([
            BankAccount.Builder
                .setId(accountId).setReference('E2E-ACC-001')
                .setType(ACCOUNT_TYPE.CHECKING).setBalance(100000)
                .setState(ACCOUNT_STATE.ACTIVE).setAgreementId(agreementId)
                .setCreatedAt(new Date()).setUpdatedAt(new Date()).build(),
        ]);

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(CONCILIATION_REPOSITORY).useValue(conciliationRepo)
            .overrideProvider(TRANSACTION_REPOSITORY).useValue(txRepo)
            .overrideProvider(BANK_ACCOUNT_REPOSITORY).useValue(accountRepo)
            .overrideProvider(AUTH_USER_REPOSITORY).useValue(userRepo)
            .overrideProvider(AUTH_REFRESH_TOKEN_REPOSITORY).useValue(refreshTokenRepo)
            .compile();

        app = moduleFixture.createNestApplication();
        app.enableVersioning({
            type: VersioningType.HEADER,
            header: 'x-api-version',
        });
        app.setGlobalPrefix(API_PREFIX);
        app.use(cookieParser());
        app.useGlobalPipes(new ValidationPipe({ transform: true }));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Authentication', () => {
        it('GET /api/health should return 200', () => {
            return request(app.getHttpServer())
                .get(`${API_PREFIX}/health`)
                .expect(200);
        });

        it('POST /api/auth/login should return JWT token', async () => {
            const res = await request(app.getHttpServer())
                .post(`${API_PREFIX}/auth/login`)
                .set('x-api-version', '1')
                .send({ email: 'admin@e2e.test', password: 'admin123' })
                .expect(200);

            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
            expect(res.body.metadata.statusCode).toBe(200);
            jwtToken = res.body.data.accessToken;
        });

        it('should reject invalid credentials', () => {
            return request(app.getHttpServer())
                .post(`${API_PREFIX}/auth/login`)
                .set('x-api-version', '1')
                .send({ email: 'admin@e2e.test', password: 'wrong' })
                .expect(401);
        });
    });

    describe('Transactions', () => {
        const correlationId = crypto.randomUUID();

        it('POST /api/transactions should create bank_a transaction', async () => {
            const res = await request(app.getHttpServer())
                .post(`${API_PREFIX}/transactions`)
                .set('x-api-version', '1')
                .set('Authorization', `Bearer ${jwtToken}`)
                .send({
                    account_id: accountId,
                    operation: 'withdrawal',
                    description: 'E2E bank_a withdrawal',
                    amount: 5000,
                    type: 'debit',
                    source_bank: 'bank_a',
                    correlation_id: correlationId,
                })
                .expect(201);

            expect(res.body.data.sourceBank).toBe('bank_a');
            expect(res.body.data.correlationId).toBe(correlationId);
            expect(res.body.metadata.statusCode).toBe(201);
        });

        it('POST /api/transactions should create bank_b transaction with same correlationId', async () => {
            const res = await request(app.getHttpServer())
                .post(`${API_PREFIX}/transactions`)
                .set('x-api-version', '1')
                .set('Authorization', `Bearer ${jwtToken}`)
                .send({
                    account_id: accountId,
                    operation: 'deposit',
                    description: 'E2E bank_b deposit',
                    amount: 5000,
                    type: 'credit',
                    source_bank: 'bank_b',
                    correlation_id: correlationId,
                })
                .expect(201);

            expect(res.body.data.sourceBank).toBe('bank_b');
            expect(res.body.data.correlationId).toBe(correlationId);
        });

        it('POST /api/transactions should create bank_a without matching bank_b', async () => {
            const res = await request(app.getHttpServer())
                .post(`${API_PREFIX}/transactions`)
                .set('x-api-version', '1')
                .set('Authorization', `Bearer ${jwtToken}`)
                .send({
                    account_id: accountId,
                    operation: 'withdrawal',
                    description: 'E2E orphan bank_a',
                    amount: 3000,
                    type: 'debit',
                    source_bank: 'bank_a',
                    correlation_id: crypto.randomUUID(),
                })
                .expect(201);

            expect(res.body.data.sourceBank).toBe('bank_a');
        });

        it('POST /api/transactions should create bank_b without matching bank_a', async () => {
            const res = await request(app.getHttpServer())
                .post(`${API_PREFIX}/transactions`)
                .set('x-api-version', '1')
                .set('Authorization', `Bearer ${jwtToken}`)
                .send({
                    account_id: accountId,
                    operation: 'deposit',
                    description: 'E2E orphan bank_b',
                    amount: 1500,
                    type: 'credit',
                    source_bank: 'bank_b',
                    correlation_id: crypto.randomUUID(),
                })
                .expect(201);

            expect(res.body.data.sourceBank).toBe('bank_b');
        });

        it('GET /api/transactions should list all transactions', async () => {
            const res = await request(app.getHttpServer())
                .get(`${API_PREFIX}/transactions`)
                .set('x-api-version', '1')
                .set('Authorization', `Bearer ${jwtToken}`)
                .expect(200);

            expect(res.body.data.length).toBe(4);
            expect(res.body.metadata.pagination).toBeDefined();
        });
    });

    describe('Conciliation', () => {
        let conciliationId: string;

        it('POST /api/conciliation/run should execute conciliation', async () => {
            const res = await request(app.getHttpServer())
                .post(`${API_PREFIX}/conciliation/run`)
                .set('x-api-version', '1')
                .set('Authorization', `Bearer ${jwtToken}`)
                .send({})
                .expect(201);

            expect(res.body.data.status).toBe('completed');
            expect(res.body.data.summary).toBeDefined();
            expect(res.body.metadata.message).toBe('Conciliation completed');

            conciliationId = res.body.data.id;
        });

        it('GET /api/conciliation should list conciliations', async () => {
            const res = await request(app.getHttpServer())
                .get(`${API_PREFIX}/conciliation`)
                .set('x-api-version', '1')
                .set('Authorization', `Bearer ${jwtToken}`)
                .expect(200);

            expect(res.body.data.length).toBe(1);
            expect(res.body.metadata.pagination.totalItems).toBe(1);
        });

        it('GET /api/conciliation/:id should return report with matches', async () => {
            const res = await request(app.getHttpServer())
                .get(`${API_PREFIX}/conciliation/${conciliationId}`)
                .set('x-api-version', '1')
                .set('Authorization', `Bearer ${jwtToken}`)
                .expect(200);

            expect(res.body.data.conciliation.id).toBe(conciliationId);
            expect(res.body.data.matches.length).toBeGreaterThan(0);
            expect(res.body.metadata.statusCode).toBe(200);
        });
    });

    describe('Resolve Discrepancy', () => {
        let matchId: string;

        it('should find unresolved matches', async () => {
            const allConciliations = await request(app.getHttpServer())
                .get(`${API_PREFIX}/conciliation`)
                .set('x-api-version', '1')
                .set('Authorization', `Bearer ${jwtToken}`)
                .expect(200);

            const cid = allConciliations.body.data[0].id;
            const report = await request(app.getHttpServer())
                .get(`${API_PREFIX}/conciliation/${cid}`)
                .set('x-api-version', '1')
                .set('Authorization', `Bearer ${jwtToken}`)
                .expect(200);

            const missing = report.body.data.matches.filter((m: { status: string }) => m.status === 'missing');
            expect(missing.length).toBeGreaterThan(0);
            matchId = missing[0].id;
        });

        it('PATCH /api/conciliation/:id/resolve/:matchId should resolve', async () => {
            const allConciliations = await request(app.getHttpServer())
                .get(`${API_PREFIX}/conciliation`)
                .set('x-api-version', '1')
                .set('Authorization', `Bearer ${jwtToken}`)
                .expect(200);

            const cid = allConciliations.body.data[0].id;

            await request(app.getHttpServer())
                .patch(`${API_PREFIX}/conciliation/${cid}/resolve/${matchId}`)
                .set('x-api-version', '1')
                .set('Authorization', `Bearer ${jwtToken}`)
                .send({ notes: 'Resolved during E2E test' })
                .expect(200);
        });
    });

    describe('Error Handling', () => {
        it('should return 404 for unknown conciliation', () => {
            return request(app.getHttpServer())
                .get(`${API_PREFIX}/conciliation/nonexistent-id`)
                .set('x-api-version', '1')
                .set('Authorization', `Bearer ${jwtToken}`)
                .expect(404);
        });

        it('should return 401 without auth token', () => {
            return request(app.getHttpServer())
                .get(`${API_PREFIX}/conciliation`)
                .set('x-api-version', '1')
                .expect(401);
        });

        it('should return 404 for unknown routes', () => {
            return request(app.getHttpServer())
                .get(`${API_PREFIX}/nonexistent`)
                .expect(404);
        });
    });
});
