import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('agreement')
export class AgreementEntity {
    @PrimaryColumn({ name: 'id', type: 'uuid' })
    public id: string;

    @Column({ name: 'name', nullable: false })
    public name: string;

    @Column({ name: 'reference', nullable: false })
    public reference: string;

    @Column({ name: 'state', nullable: false, default: "'active'" })
    public state: string;

    @Column({ name: 'api_url', nullable: true })
    public apiUrl?: string;

    @Column({ name: 'auth_type', nullable: true })
    public authType?: string;

    @Column({ name: 'auth_config', type: 'jsonb', nullable: true })
    public authConfig?: Record<string, any>;

    @Column({ name: 'created_at', nullable: false })
    public createdAt: Date;

    @Column({ name: 'updated_at', nullable: false })
    public updatedAt: Date;

    @Column({ name: 'deleted_at', nullable: true })
    public deletedAt?: Date;
}
