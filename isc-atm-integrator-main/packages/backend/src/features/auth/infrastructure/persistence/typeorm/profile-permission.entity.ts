import { Entity, Column } from 'typeorm';

@Entity('profile_permission')
export class ProfilePermissionEntity {
    @Column({ name: 'profile_id', primary: true })
    public profileId: string;

    @Column({ name: 'permission_id', primary: true })
    public permissionId: string;
}
