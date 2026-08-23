import { Entity, Column } from 'typeorm';

@Entity('user_profile')
export class UserProfileEntity {
    @Column({ name: 'user_id', primary: true })
    public userId: string;

    @Column({ name: 'profile_id', primary: true })
    public profileId: string;
}
