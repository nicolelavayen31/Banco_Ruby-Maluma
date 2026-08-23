import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('auth_profile')
export class AuthProfileEntity {
    @PrimaryColumn({ name: 'id', type: 'uuid' })
    public id: string;

    @Column({ name: 'name' })
    public name: string;

    @Column({ name: 'description' })
    public description?: string;

    @Column({ name: 'created_at' })
    public createdAt: Date;

    @Column({ name: 'updated_at' })
    public updatedAt: Date;
}
