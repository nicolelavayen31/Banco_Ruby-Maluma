export const API_KEY_STATE = {
    ACTIVE: 'active',
    REVOKED: 'revoked',
} as const;

export class ApiKeyBuilder {
    private id: string;
    private keyHash: string;
    private prefix: string;
    private name: string;
    private state: (typeof API_KEY_STATE)[keyof typeof API_KEY_STATE];
    private agreementId: string;
    private createdBy: string;
    private profileId: string;
    private expiresAt?: Date;
    private createdAt: Date;
    private updatedAt: Date;
    private deletedAt?: Date;

    public setId(id: string): this {
        this.id = id;
        return this;
    }
    public setKeyHash(hash: string): this {
        this.keyHash = hash;
        return this;
    }
    public setPrefix(prefix: string): this {
        this.prefix = prefix;
        return this;
    }
    public setName(name: string): this {
        this.name = name;
        return this;
    }
    public setState(
        state: (typeof API_KEY_STATE)[keyof typeof API_KEY_STATE],
    ): this {
        this.state = state;
        return this;
    }
    public setAgreementId(agreementId: string): this {
        this.agreementId = agreementId;
        return this;
    }
    public setCreatedBy(userId: string): this {
        this.createdBy = userId;
        return this;
    }
    public setProfileId(profileId: string): this {
        this.profileId = profileId;
        return this;
    }
    public setExpiresAt(expiresAt?: Date): this {
        this.expiresAt = expiresAt;
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

    public build(): ApiKey {
        return new ApiKey(
            this.id,
            this.keyHash,
            this.prefix,
            this.name,
            this.state,
            this.agreementId,
            this.createdBy,
            this.profileId,
            this.createdAt,
            this.updatedAt,
            this.expiresAt,
            this.deletedAt,
        );
    }
}

export class ApiKey {
    public readonly id: string;
    public readonly keyHash: string;
    public readonly prefix: string;
    public readonly name: string;
    public readonly state: (typeof API_KEY_STATE)[keyof typeof API_KEY_STATE];
    public readonly agreementId: string;
    public readonly createdBy: string;
    public readonly profileId: string;
    public readonly expiresAt?: Date;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;
    public readonly deletedAt?: Date;

    public constructor(
        id: string,
        keyHash: string,
        prefix: string,
        name: string,
        state: (typeof API_KEY_STATE)[keyof typeof API_KEY_STATE],
        agreementId: string,
        createdBy: string,
        profileId: string,
        createdAt: Date,
        updatedAt: Date,
        expiresAt?: Date,
        deletedAt?: Date,
    ) {
        this.id = id;
        this.keyHash = keyHash;
        this.prefix = prefix;
        this.name = name;
        this.state = state;
        this.agreementId = agreementId;
        this.createdBy = createdBy;
        this.profileId = profileId;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
    }

    public static get Builder(): ApiKeyBuilder {
        return new ApiKeyBuilder();
    }
}
