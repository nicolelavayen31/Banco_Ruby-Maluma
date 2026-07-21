import { ApiProperty } from '@nestjs/swagger';

export class AgreementBuilder {
    private id: string;
    private name: string;
    private reference: string;
    private state: (typeof AGREEMENT_STATE)[keyof typeof AGREEMENT_STATE];
    private createdAt: Date;
    private updatedAt: Date;
    private deletedAt?: Date;

    public setId(id: string): this {
        this.id = id;
        return this;
    }

    public setName(name: string): this {
        this.name = name;
        return this;
    }

    public setReference(reference: string): this {
        this.reference = reference;
        return this;
    }

    public setState(
        state: (typeof AGREEMENT_STATE)[keyof typeof AGREEMENT_STATE],
    ): this {
        this.state = state;
        return this;
    }

    public setCreatedAt(createdAt: Date): this {
        this.createdAt = createdAt;
        return this;
    }

    public setUpdatedAt(updatedAt: Date): this {
        this.updatedAt = updatedAt;
        return this;
    }

    public setDeletedAt(deletedAt?: Date): this {
        this.deletedAt = deletedAt;
        return this;
    }

    public build(): Agreement {
        return new Agreement(
            this.id,
            this.name,
            this.reference,
            this.state,
            this.createdAt,
            this.updatedAt,
            this.deletedAt,
        );
    }
}

export const AGREEMENT_STATE = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

export class Agreement {
    @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
    public readonly id: string;

    @ApiProperty({ example: 'Banco Nacional' })
    public readonly name: string;

    @ApiProperty({ example: 'BN-001' })
    public readonly reference: string;

    @ApiProperty({ enum: AGREEMENT_STATE })
    public readonly state: (typeof AGREEMENT_STATE)[keyof typeof AGREEMENT_STATE];

    @ApiProperty({ example: '2026-07-09T22:31:30.974Z' })
    public readonly createdAt: Date;

    @ApiProperty({ example: '2026-07-09T22:31:30.974Z' })
    public readonly updatedAt: Date;

    @ApiProperty({ example: '2026-07-09T22:31:30.974Z', required: false })
    public readonly deletedAt?: Date;

    public constructor(
        id: string,
        name: string,
        reference: string,
        state: (typeof AGREEMENT_STATE)[keyof typeof AGREEMENT_STATE],
        createdAt: Date,
        updatedAt: Date,
        deletedAt?: Date,
    ) {
        this.id = id;
        this.name = name;
        this.reference = reference;
        this.state = state;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
    }

    public static get Builder(): AgreementBuilder {
        return new AgreementBuilder();
    }
}
