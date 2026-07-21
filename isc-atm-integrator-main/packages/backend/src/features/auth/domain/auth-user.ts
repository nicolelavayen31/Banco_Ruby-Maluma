export const AUTH_USER_STATE = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

export class AuthUserBuilder {
    private id: string;
    private email: string;
    private passwordHash: string;
    private name: string;
    private state: (typeof AUTH_USER_STATE)[keyof typeof AUTH_USER_STATE];
    private agreementId: string;
    private createdAt: Date;
    private updatedAt: Date;
    private deletedAt?: Date;

    public setId(id: string): this {
        this.id = id;
        return this;
    }
    public setEmail(email: string): this {
        this.email = email;
        return this;
    }
    public setPasswordHash(hash: string): this {
        this.passwordHash = hash;
        return this;
    }
    public setName(name: string): this {
        this.name = name;
        return this;
    }
    public setState(
        state: (typeof AUTH_USER_STATE)[keyof typeof AUTH_USER_STATE],
    ): this {
        this.state = state;
        return this;
    }
    public setAgreementId(agreementId: string): this {
        this.agreementId = agreementId;
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

    public build(): AuthUser {
        return new AuthUser(
            this.id,
            this.email,
            this.passwordHash,
            this.name,
            this.state,
            this.agreementId,
            this.createdAt,
            this.updatedAt,
            this.deletedAt,
        );
    }
}

export class AuthUser {
    public readonly id: string;
    public readonly email: string;
    public readonly passwordHash: string;
    public readonly name: string;
    public readonly state: (typeof AUTH_USER_STATE)[keyof typeof AUTH_USER_STATE];
    public readonly agreementId: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;
    public readonly deletedAt?: Date;

    public constructor(
        id: string,
        email: string,
        passwordHash: string,
        name: string,
        state: (typeof AUTH_USER_STATE)[keyof typeof AUTH_USER_STATE],
        agreementId: string,
        createdAt: Date,
        updatedAt: Date,
        deletedAt?: Date,
    ) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.name = name;
        this.state = state;
        this.agreementId = agreementId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
    }

    public static get Builder(): AuthUserBuilder {
        return new AuthUserBuilder();
    }
}
