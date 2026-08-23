import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ConciliationEntity } from './conciliation.entity';

@Entity('conciliation_matches')
export class ConciliationMatchEntity {
    @PrimaryColumn({ name: 'id', type: 'uuid' })
    public id: string;

    @Column({ name: 'conciliation_id' })
    public conciliationId: string;

    @Column({ name: 'internal_tx_id' })
    public internalTxId: string;

    @Column({ name: 'external_tx_id', nullable: true })
    public externalTxId?: string;

    @Column({ name: 'status' })
    public status: string;

    @Column({ name: 'amount_diff', default: 0 })
    public amountDiff: number;

    @Column({ name: 'notes', nullable: true })
    public notes?: string;

    @ManyToOne(() => ConciliationEntity)
    @JoinColumn({ name: 'conciliation_id' })
    public conciliation: ConciliationEntity;
}
