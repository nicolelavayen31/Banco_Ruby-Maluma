import { HttpStatus, Inject, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { ResilienceCommand, TimeoutStrategy } from 'nestjs-resilience';
import { RefreshCommand } from './command';
import { RefreshResponse, RefreshData } from './response.dto';
import { AUTH_REFRESH_TOKEN_REPOSITORY } from '@features/auth/domain/auth-refresh-token.repository';
import type { IAuthRefreshTokenRepository } from '@features/auth/domain/auth-refresh-token.repository';
import { AUTH_USER_REPOSITORY } from '@features/auth/domain/auth-user.repository';
import type { IAuthUserRepository } from '@features/auth/domain/auth-user.repository';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';
import type { AppConfigService } from '@shared/core/types';

@CommandHandler(RefreshCommand)
export class RefreshHandler
    extends ResilienceCommand
    implements ICommandHandler<RefreshCommand>
{
    public constructor(
        @Inject(AUTH_REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepository: IAuthRefreshTokenRepository,
        @Inject(AUTH_USER_REPOSITORY)
        private readonly userRepository: IAuthUserRepository,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        super([new TimeoutStrategy(10_000)]);
    }

    public async run(command: RefreshCommand): Promise<RefreshResponse> {
        const tokenHash = createHash('sha256')
            .update(command.refreshToken)
            .digest('hex');

        const stored = await this.refreshTokenRepository.findByHash(tokenHash);
        if (!stored) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (new Date() > stored.expiresAt) {
            await this.refreshTokenRepository.delete(stored.id);
            throw new UnauthorizedException('Refresh token expired');
        }

        const user = await this.userRepository.findById(stored.userId);
        if (!user || user.state !== 'active') {
            await this.refreshTokenRepository.delete(stored.id);
            throw new UnauthorizedException('User not found or inactive');
        }

        await this.refreshTokenRepository.delete(stored.id);

        const userPermissions =
            await this.userRepository.findPermissionsByUserId(user.id);

        const payload = {
            sub: user.id,
            agreementId: user.agreementId,
            permissions: userPermissions,
        };

        const accessToken = await this.jwtService.signAsync(payload);

        const rawToken = randomBytes(48).toString('hex');
        const newTokenHash = createHash('sha256')
            .update(rawToken)
            .digest('hex');
        const cfg = this.configService as unknown as AppConfigService;
        const refreshExpiresIn = cfg.get('security.jwt.refreshExpiresIn', {
            infer: true,
        });

        await this.refreshTokenRepository.save({
            id: randomUUID(),
            tokenHash: newTokenHash,
            expiresAt: new Date(Date.now() + refreshExpiresIn * 1000),
            userId: user.id,
            createdAt: new Date(),
        });

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.OK)
            .setMessage('Token refreshed')
            .build();

        return new RefreshResponse(
            new RefreshData(accessToken, rawToken),
            metadata,
        );
    }
}
