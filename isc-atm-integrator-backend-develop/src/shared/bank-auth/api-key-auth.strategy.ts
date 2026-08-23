import type { AuthStrategy, AuthRequest } from './auth-strategy.interface';

export class ApiKeyAuthStrategy implements AuthStrategy {
    public readonly type = 'api_key' as const;

    public apply(
        request: AuthRequest,
        config: Record<string, any>,
    ): AuthRequest {
        const key: string | undefined = config.key as string | undefined;
        if (!key) {
            throw new Error(
                'API key auth strategy requires "key" in authConfig',
            );
        }

        return {
            ...request,
            headers: {
                ...request.headers,
                'x-api-key': key,
            },
        };
    }
}
