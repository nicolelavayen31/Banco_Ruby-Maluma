import { ApiResponseError } from '../response/api-response-error';
import { ApiResponseErrorBuilder } from '../response/api-response-error-builder';

describe('ApiResponseError', () => {
    describe('constructor', () => {
        it('should create an error response with all fields', () => {
            const error = new ApiResponseError(
                '123e4567-e89b-12d3-a456-426614174000',
                'Order not found',
                'NOT_FOUND',
                404,
                'Resource does not exist',
                'Not Found',
                '/api/orders/123',
                'order',
                '2026-07-11T12:00:00.000Z',
            );

            expect(error.id).toBe('123e4567-e89b-12d3-a456-426614174000');
            expect(error.message).toBe('Order not found');
            expect(error.code).toBe('NOT_FOUND');
            expect(error.status).toBe(404);
            expect(error.cause).toBe('Resource does not exist');
            expect(error.error).toBe('Not Found');
            expect(error.path).toBe('/api/orders/123');
            expect(error.resource).toBe('order');
            expect(error.timestamp).toBe('2026-07-11T12:00:00.000Z');
        });
    });

    describe('Builder', () => {
        it('should build an error with chained setters', () => {
            const error = new ApiResponseErrorBuilder()
                .setId('id-1')
                .setMessage('Unauthorized')
                .setCode('UNAUTHORIZED')
                .setStatus(401)
                .setCause('Invalid token')
                .setError('Unauthorized')
                .setPath('/api/auth/login')
                .setResource('auth')
                .setTimestamp('2026-01-01T00:00:00.000Z')
                .build();

            expect(error.message).toBe('Unauthorized');
            expect(error.status).toBe(401);
            expect(error.code).toBe('UNAUTHORIZED');
            expect(error.path).toBe('/api/auth/login');
        });

        it('should support method chaining', () => {
            const builder = new ApiResponseErrorBuilder()
                .setId('id')
                .setMessage('msg');
            expect(builder.setCode).toBeDefined();
            expect(builder.setStatus).toBeDefined();
            expect(builder.setPath).toBeDefined();
        });
    });
});
