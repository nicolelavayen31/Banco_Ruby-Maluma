import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('transaction')
export class TransactionEntity {
    @PrimaryColumn({ name: 'id', type: 'uuid' })
    public id: string;

    @Column({ name: 'amount', nullable: true })
    public amount?: number;

    @Column({ name: 'operation' })
    public operation: string;

    @Column({ name: 'type', nullable: true })
    public type?: string;

    @Column({ name: 'state' })
    public state: string;

    @Column({ name: 'description' })
    public description: string;

    @Column({ name: 'bank_account_id' })
    public bankAccountId: string;

    @Column({ name: 'correlation_id', nullable: true })
    public correlationId?: string;

    @Column({ name: 'source_bank', default: 'bank_a' })
    public sourceBank: string;

    @Column({ name: 'created_at' })
    public createdAt: Date;

    @Column({ name: 'updated_at' })
    public updatedAt: Date;

    @Column({ name: 'deleted_at', nullable: true })
    public deletedAt?: Date;
}
