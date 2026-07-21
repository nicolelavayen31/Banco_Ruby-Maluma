import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('agreement')
export class AgreementEntity {
    @PrimaryColumn({ name: 'id', type: 'uuid' })
    public id: string;

    @Column({ name: 'name' })
    public name: string;

    @Column({ name: 'reference' })
    public reference: string;

    @Column({ name: 'state' })
    public state: string;

    @Column({ name: 'created_at' })
    public createdAt: Date;

    @Column({ name: 'updated_at' })
    public updatedAt: Date;

    @Column({ name: 'deleted_at', nullable: true })
    public deletedAt?: Date;
}
