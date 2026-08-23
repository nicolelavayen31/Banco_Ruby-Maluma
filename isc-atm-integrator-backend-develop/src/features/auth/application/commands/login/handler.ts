import { HttpStatus, Inject, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { ResilienceCommand, TimeoutStrategy } from 'nestjs-resilience';
import { LoginCommand } from './command';
import { LoginResponse, LoginData } from './response.dto';
import { AUTH_USER_REPOSITORY } from '@features/auth/domain/auth-user.repository';
import type { IAuthUserRepository } from '@features/auth/domain/auth-user.repository';
import { AUTH_REFRESH_TOKEN_REPOSITORY } from '@features/auth/domain/auth-refresh-token.repository';
import type { IAuthRefreshTokenRepository } from '@features/auth/domain/auth-refresh-token.repository';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';
import type { AppConfigService } from '@shared/core/types';

@CommandHandler(LoginCommand)
export class LoginHandler
    extends ResilienceCommand
    implements ICommandHandler<LoginCommand>
{
    public constructor(
        @Inject(AUTH_USER_REPOSITORY)
        private readonly userRepository: IAuthUserRepository,
        @Inject(AUTH_REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepository: IAuthRefreshTokenRepository,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        super([new TimeoutStrategy(10_000)]);
    }

    public async run(command: LoginCommand): Promise<LoginResponse> {
        const user = await this.userRepository.findByEmail(command.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
            command.password,
            user.passwordHash,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.state !== 'active') {
            throw new UnauthorizedException('User is inactive');
        }

        const userPermissions =
            await this.userRepository.findPermissionsByUserId(user.id);

        const payload = {
            sub: user.id,
            agreementId: user.agreementId,
            permissions: userPermissions,
        };

        const accessToken = await this.jwtService.signAsync(payload);

        const rawToken = randomBytes(48).toString('hex');
        const tokenHash = createHash('sha256').update(rawToken).digest('hex');
        const cfg = this.configService as unknown as AppConfigService;
        const refreshExpiresIn = cfg.get('security.jwt.refreshExpiresIn', {
            infer: true,
        });

        await this.refreshTokenRepository.deleteByUserId(user.id);

        await this.refreshTokenRepository.save({
            id: randomUUID(),
            tokenHash,
            expiresAt: new Date(Date.now() + refreshExpiresIn * 1000),
            userId: user.id,
            createdAt: new Date(),
        });

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.OK)
            .setMessage('Login successful')
            .build();

        return new LoginResponse(
            new LoginData(accessToken, rawToken),
            metadata,
        );
    }
}
