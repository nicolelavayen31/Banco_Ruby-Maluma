import { ApiProperty } from '@nestjs/swagger';

export interface IApiResponseError {
    readonly id: string;
    readonly path: string;
    readonly code: string;
    readonly status: number;
    readonly cause: unknown;
    readonly message: string | string[];
    readonly timestamp: string;
}

export class ApiResponseError implements IApiResponseError {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Correlation/transaction ID for tracing',
    })
    public readonly id: string;

    @ApiProperty({ example: 'Order not found', description: 'Error message' })
    public readonly message: string;

    @ApiProperty({ example: 'NOT_FOUND', description: 'Error code identifier' })
    public readonly code: string;

    @ApiProperty({ example: 404, description: 'HTTP status code' })
    public readonly status: number;

    @ApiProperty({
        type: String,
        nullable: true,
        example: null,
        description: 'Underlying cause of the error',
    })
    public readonly cause: string;

    @ApiProperty({
        example: 'Not Found',
        description: 'Standard HTTP error label',
    })
    public readonly error: string;

    @ApiProperty({
        example: '/api/orders/123',
        description: 'Request path where the error occurred',
    })
    public readonly path: string;

    @ApiProperty({
        example: 'order',
        description: 'Resource type related to the error',
    })
    public readonly resource: string;

    @ApiProperty({
        example: '2026-07-11T12:00:00.000Z',
        description: 'Timestamp when the error occurred',
    })
    public readonly timestamp: string;

    public constructor(
        id: string,
        message: string,
        code: string,
        status: number,
        cause: string,
        error: string,
        path: string,
        resource: string,
        timestamp: string,
    ) {
        this.id = id;
        this.message = message;
        this.code = code;
        this.status = status;
        this.cause = cause;
        this.error = error;
        this.path = path;
        this.resource = resource;
        this.timestamp = timestamp;
    }
}
