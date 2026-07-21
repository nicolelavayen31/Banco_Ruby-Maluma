import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('conciliations')
export class ConciliationEntity {
    @PrimaryColumn({ name: 'id', type: 'uuid' })
    public id: string;

    @Column({ name: 'run_at' })
    public runAt: Date;

    @Column({ name: 'status' })
    public status: string;

    @Column({ name: 'summary', type: 'jsonb' })
    public summary: { matched: number; discrepancies: number; missing: number };
}
