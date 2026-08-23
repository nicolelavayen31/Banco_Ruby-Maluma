import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AUTH_USER_REPOSITORY } from '@features/auth/domain/auth-user.repository';
import type { IAuthUserRepository } from '@features/auth/domain/auth-user.repository';
import type { IAuthClient } from '../domain/auth-client.interface';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(
        @Inject(AUTH_USER_REPOSITORY)
        private readonly userRepository: IAuthUserRepository,
    ) {
        super({ usernameField: 'email' });
    }

    public async validate(
        email: string,
        password: string,
    ): Promise<IAuthClient> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.state !== 'active') {
            throw new UnauthorizedException('User is inactive');
        }

        return {
            authType: 'user',
            userId: user.id,
            agreementId: user.agreementId,
            permissions: [],
        };
    }
}
