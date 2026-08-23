import type { AuthStrategy } from './auth-strategy.interface';
import { JwtAuthStrategy } from './jwt-auth.strategy';
import { ApiKeyAuthStrategy } from './api-key-auth.strategy';

const strategies: Record<string, AuthStrategy> = {
    jwt: new JwtAuthStrategy(),
    api_key: new ApiKeyAuthStrategy(),
};

export class AuthStrategyFactory {
    public static create(authType: string): AuthStrategy {
        const strategy = strategies[authType];
        if (!strategy) {
            throw new Error(
                `Unknown auth type: ${authType}. Supported: jwt, api_key`,
            );
        }
        return strategy;
    }
}
