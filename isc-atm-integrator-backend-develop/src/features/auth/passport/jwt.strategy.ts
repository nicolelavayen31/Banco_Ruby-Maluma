import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { AppConfigService } from '@shared/core/types';
import type { IAuthClient } from '../domain/auth-client.interface';

interface JwtPayload {
    sub: string;
    agreementId: string;
    permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(configService: ConfigService) {
        const cfg = configService as unknown as AppConfigService;
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: cfg.get('security.jwt.secret', { infer: true }),
        });
    }

    public async validate(payload: JwtPayload): Promise<IAuthClient> {
        return {
            authType: 'user',
            userId: payload.sub,
            agreementId: payload.agreementId,
            permissions: payload.permissions ?? [],
        };
    }
}
