import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('api_key')
export class ApiKeyEntity {
    @PrimaryColumn({ name: 'id', type: 'uuid' })
    public id: string;

    @Column({ name: 'key_hash' })
    public keyHash: string;

    @Column({ name: 'prefix' })
    public prefix: string;

    @Column({ name: 'name' })
    public name: string;

    @Column({ name: 'state' })
    public state: string;

    @Column({ name: 'agreement_id' })
    public agreementId: string;

    @Column({ name: 'created_by' })
    public createdBy: string;

    @Column({ name: 'profile_id' })
    public profileId: string;

    @Column({ name: 'expires_at', nullable: true })
    public expiresAt?: Date;

    @Column({ name: 'created_at' })
    public createdAt: Date;

    @Column({ name: 'updated_at' })
    public updatedAt: Date;

    @Column({ name: 'deleted_at', nullable: true })
    public deletedAt?: Date;
}
