import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Message } from './message.entity';
import { GroupMember } from './group-member.entity';

@Entity('users')
export class User {
  @PrimaryColumn()
  uid: string; // normalized phone number

  @Column()
  name: string;

  @Column({ default: '' })
  profilePic: string;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: false })
  isBlocked: boolean;

  @Column()
  phoneNumber: string;

  @OneToMany(() => GroupMember, (groupMember) => groupMember.user)
  groupMembers: GroupMember[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

