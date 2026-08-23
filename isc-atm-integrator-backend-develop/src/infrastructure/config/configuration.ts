export default () => ({
    features: {
        validateBalance: process.env.FEATURE_VALIDATE_BALANCE !== 'false',
    },

    app: {
        isDevMode: process.env.NODE_ENV === 'development',
    },

    server: {
        port: parseInt(String(process.env.APP_SERVER_PORT), 10) || 7000,
        prefix: String(process.env.APP_SERVER_PREFIX ?? '/api'),
        cors: {
            origin: String(process.env.APP_CORS_ORIGIN ?? '*'),
            methods: String(
                process.env.APP_CORS_METHODS ??
                    'GET,HEAD,PUT,PATCH,POST,DELETE',
            ),
            credentials: process.env.APP_CORS_CREDENTIALS === 'true',
        },
    },

    cache: {
        redis: {
            host: String(
                process.env.APP_CACHE_REDIS_HOST ?? 'redis://localhost:6379',
            ),

            ttl:
                parseInt(String(process.env.APP_CACHE_REDIS_TTL), 10) || 60_000,
        },
    },

    database: {
        type: String(process.env.DB_TYPE ?? 'postgres'),
        postgres: {
            host: String(process.env.DB_HOST ?? 'localhost'),
            port: parseInt(String(process.env.DB_PORT ?? '5432'), 10),
            username: String(process.env.DB_USERNAME ?? 'postgres'),
            password: String(process.env.DB_PASSWORD ?? 'postgres'),
            name: String(process.env.DB_NAME ?? 'isc_atm'),
            synchronize: process.env.NODE_ENV !== 'production',
        },
        migrations: {
            dir: String(
                process.env.TYPEORM_MIGRATIONS_DIR ??
                    'src/infrastructure/database/migrations',
            ),
            tableName: String(
                process.env.TYPEORM_MIGRATIONS_TABLE_NAME ??
                    'typeorm_migrations',
            ),
        },
    },

    security: {
        jwt: {
            secret: String(
                process.env.APP_JWT_SECRET ??
                    'atm-integrator-jwt-secret-change-in-prod',
            ),
            expiresIn: String(process.env.APP_JWT_EXPIRES_IN ?? '15m'),
            refreshExpiresIn: parseInt(
                String(process.env.APP_JWT_REFRESH_EXPIRES_IN ?? '604800'),
                10,
            ),
        },
        csrf: {
            enabled: process.env.APP_CSRF_ENABLED !== 'false',
            secret: String(
                process.env.APP_CSRF_SECRET ??
                    'atm-integrator-csrf-secret-change-in-prod',
            ),
            cookieName: String(process.env.APP_CSRF_COOKIE ?? 'x-csrf-token'),
        },
    },
});
