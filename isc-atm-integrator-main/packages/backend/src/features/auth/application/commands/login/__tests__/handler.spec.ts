import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { LoginHandler } from '../handler';
import { LoginCommand } from '../command';
import { AUTH_USER_REPOSITORY } from '../../../../domain/auth-user.repository';
import { AUTH_REFRESH_TOKEN_REPOSITORY } from '../../../../domain/auth-refresh-token.repository';
import { InMemoryAuthUserRepository } from '../../../../infrastructure/persistence/__tests__/in-memory/auth-user.repository';
import { InMemoryAuthRefreshTokenRepository } from '../../../../infrastructure/persistence/__tests__/in-memory/auth-refresh-token.repository';
import { AuthUser, AUTH_USER_STATE } from '../../../../domain/auth-user';

function createMockJwtService(): JwtService {
    const mock = { signAsync: () => Promise.resolve('mock-jwt-token') } as unknown as JwtService;
    return mock;
}

function createMockConfigService(): ConfigService {
    const mock = {
        get: (key: string) => {
            if (key === 'security.jwt.refreshExpiresIn') return 604800;
            return undefined;
        },
    } as unknown as ConfigService;
    return mock;
}

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 4);
}

function makeCommand(email: string, password: string): LoginCommand {
    return Object.assign(new LoginCommand(), { email, password });
}

describe('LoginHandler', () => {
    let handler: LoginHandler;
    let userRepo: InMemoryAuthUserRepository;
    let refreshTokenRepo: InMemoryAuthRefreshTokenRepository;
    let jwtService: JwtService;
    let configService: ConfigService;

    beforeEach(async () => {
        userRepo = new InMemoryAuthUserRepository();
        refreshTokenRepo = new InMemoryAuthRefreshTokenRepository();
        jwtService = createMockJwtService();
        configService = createMockConfigService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LoginHandler,
                { provide: AUTH_USER_REPOSITORY, useValue: userRepo },
                { provide: AUTH_REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepo },
                { provide: JwtService, useValue: jwtService },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        handler = module.get(LoginHandler);
    });

    afterEach(() => {
        userRepo.reset();
        refreshTokenRepo.reset();
    });

    describe('successful login', () => {
        it('should return tokens for valid credentials', async () => {
            const passwordHash = await hashPassword('admin123');
            userRepo.seed([
                AuthUser.Builder
                    .setId('user-1')
                    .setEmail('admin@test.com')
                    .setPasswordHash(passwordHash)
                    .setName('Admin')
                    .setState(AUTH_USER_STATE.ACTIVE)
                    .setAgreementId('agr-1')
                    .setCreatedAt(new Date())
                    .setUpdatedAt(new Date())
                    .build(),
            ], { 'user-1': ['orders:read', 'orders:write'] });

            const result = await handler.execute(makeCommand('admin@test.com', 'admin123'));

            expect(result.data.accessToken).toBe('mock-jwt-token');
            expect(result.data.refreshToken).toBeDefined();
            expect(result.data.refreshToken.length).toBeGreaterThan(0);
            expect(result.metadata.statusCode).toBe(200);
            expect(result.metadata.message).toBe('Login successful');
        });

        it('should work with empty permissions', async () => {
            const passwordHash = await hashPassword('admin123');
            userRepo.seed([
                AuthUser.Builder
                    .setId('user-3')
                    .setEmail('no-perms@test.com')
                    .setPasswordHash(passwordHash)
                    .setName('No Perms')
                    .setState(AUTH_USER_STATE.ACTIVE)
                    .setAgreementId('agr-3')
                    .setCreatedAt(new Date())
                    .setUpdatedAt(new Date())
                    .build(),
            ]);

            const result = await handler.execute(makeCommand('no-perms@test.com', 'admin123'));

            expect(result.data.accessToken).toBeDefined();
            expect(result.data.refreshToken).toBeDefined();
        });
    });

    describe('failed login', () => {
        it('should throw when user is not found', async () => {
            await expect(
                handler.execute(makeCommand('unknown@test.com', 'password123')),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw when password is incorrect', async () => {
            const passwordHash = await hashPassword('correct-password');
            userRepo.seed([
                AuthUser.Builder
                    .setId('user-4')
                    .setEmail('test@test.com')
                    .setPasswordHash(passwordHash)
                    .setName('Test')
                    .setState(AUTH_USER_STATE.ACTIVE)
                    .setAgreementId('agr-4')
                    .setCreatedAt(new Date())
                    .setUpdatedAt(new Date())
                    .build(),
            ]);

            await expect(
                handler.execute(makeCommand('test@test.com', 'wrong-password')),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw when user is inactive', async () => {
            const passwordHash = await hashPassword('admin123');
            userRepo.seed([
                AuthUser.Builder
                    .setId('user-5')
                    .setEmail('inactive@test.com')
                    .setPasswordHash(passwordHash)
                    .setName('Inactive')
                    .setState(AUTH_USER_STATE.INACTIVE)
                    .setAgreementId('agr-5')
                    .setCreatedAt(new Date())
                    .setUpdatedAt(new Date())
                    .build(),
            ]);

            await expect(
                handler.execute(makeCommand('inactive@test.com', 'admin123')),
            ).rejects.toThrow('User is inactive');
        });
    });
});
