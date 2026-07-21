import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('auth_refresh_token')
export class AuthRefreshTokenEntity {
    @PrimaryColumn({ name: 'id', type: 'uuid' })
    public id: string;

    @Column({ name: 'token_hash' })
    public tokenHash: string;

    @Column({ name: 'expires_at' })
    public expiresAt: Date;

    @Column({ name: 'user_id' })
    public userId: string;

    @Column({ name: 'created_at' })
    public createdAt: Date;
}
