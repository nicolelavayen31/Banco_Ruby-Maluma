import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('auth_user')
export class AuthUserEntity {
    @PrimaryColumn({ name: 'id', type: 'uuid' })
    public id: string;

    @Column({ name: 'email' })
    public email: string;

    @Column({ name: 'password_hash' })
    public passwordHash: string;

    @Column({ name: 'name' })
    public name: string;

    @Column({ name: 'state' })
    public state: string;

    @Column({ name: 'agreement_id' })
    public agreementId: string;

    @Column({ name: 'created_at' })
    public createdAt: Date;

    @Column({ name: 'updated_at' })
    public updatedAt: Date;

    @Column({ name: 'deleted_at', nullable: true })
    public deletedAt?: Date;
}
