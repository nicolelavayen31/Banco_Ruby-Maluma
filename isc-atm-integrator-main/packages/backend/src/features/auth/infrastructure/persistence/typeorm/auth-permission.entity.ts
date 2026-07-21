import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('auth_permission')
export class AuthPermissionEntity {
    @PrimaryColumn({ name: 'id', type: 'uuid' })
    public id: string;

    @Column({ name: 'resource' })
    public resource: string;

    @Column({ name: 'action' })
    public action: string;

    @Column({ name: 'name' })
    public name: string;

    @Column({ name: 'created_at' })
    public createdAt: Date;
}
