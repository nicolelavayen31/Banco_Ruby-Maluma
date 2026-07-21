import { ApiProperty } from '@nestjs/swagger';
import { NOTIFICATION_CHANNEL } from './notification-channel';

export { NOTIFICATION_CHANNEL };

export class NotificationBuilder {
    private id: string;
    private type: string;
    private channel: (typeof NOTIFICATION_CHANNEL)[keyof typeof NOTIFICATION_CHANNEL];
    private recipientId: string;
    private title: string;
    private body: string;
    private data: Record<string, unknown>;
    private createdAt: Date;
    private readAt?: Date;

    public setId(id: string): this {
        this.id = id;
        return this;
    }

    public setType(type: string): this {
        this.type = type;
        return this;
    }

    public setChannel(
        channel: (typeof NOTIFICATION_CHANNEL)[keyof typeof NOTIFICATION_CHANNEL],
    ): this {
        this.channel = channel;
        return this;
    }

    public setRecipientId(recipientId: string): this {
        this.recipientId = recipientId;
        return this;
    }

    public setTitle(title: string): this {
        this.title = title;
        return this;
    }

    public setBody(body: string): this {
        this.body = body;
        return this;
    }

    public setData(data: Record<string, unknown>): this {
        this.data = data;
        return this;
    }

    public setCreatedAt(createdAt: Date): this {
        this.createdAt = createdAt;
        return this;
    }

    public setReadAt(readAt?: Date): this {
        this.readAt = readAt;
        return this;
    }

    public build(): Notification {
        return new Notification(
            this.id,
            this.type,
            this.channel,
            this.recipientId,
            this.title,
            this.body,
            this.data,
            this.createdAt,
            this.readAt,
        );
    }
}

export class Notification {
    @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    public readonly id: string;

    @ApiProperty({ example: 'transaction.created' })
    public readonly type: string;

    @ApiProperty({ enum: NOTIFICATION_CHANNEL })
    public readonly channel: (typeof NOTIFICATION_CHANNEL)[keyof typeof NOTIFICATION_CHANNEL];

    @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    public readonly recipientId: string;

    @ApiProperty({ example: 'New transaction' })
    public readonly title: string;

    @ApiProperty({ example: 'A transaction of $150.00 has been created.' })
    public readonly body: string;

    @ApiProperty({ example: { transactionId: 'abc-123' } })
    public readonly data: Record<string, unknown>;

    @ApiProperty({ example: '2026-07-09T22:31:30.974Z' })
    public readonly createdAt: Date;

    @ApiProperty({ example: '2026-07-09T22:31:30.974Z', required: false })
    public readonly readAt?: Date;

    public constructor(
        id: string,
        type: string,
        channel: (typeof NOTIFICATION_CHANNEL)[keyof typeof NOTIFICATION_CHANNEL],
        recipientId: string,
        title: string,
        body: string,
        data: Record<string, unknown>,
        createdAt: Date,
        readAt?: Date,
    ) {
        this.id = id;
        this.type = type;
        this.channel = channel;
        this.recipientId = recipientId;
        this.title = title;
        this.body = body;
        this.data = data;
        this.createdAt = createdAt;
        this.readAt = readAt;
    }

    public static get Builder(): NotificationBuilder {
        return new NotificationBuilder();
    }
}
