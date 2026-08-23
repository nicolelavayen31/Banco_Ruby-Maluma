import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('bank_account')
export class BankAccountEntity {
    @PrimaryColumn({ name: 'id', type: 'uuid' })
    public id: string;

    @Column({ name: 'reference' })
    public reference: string;

    @Column({ name: 'type' })
    public type: string;

    @Column({ name: 'balance' })
    public balance: number;

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
