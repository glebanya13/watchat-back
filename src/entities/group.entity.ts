import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { GroupMember } from './group-member.entity';
import { Message } from './message.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  groupId: string;

  @Column()
  senderId: string;

  @Column()
  name: string;

  @Column({ default: '' })
  lastMessage: string;

  @Column({ default: '' })
  groupPic: string;

  @OneToMany(() => GroupMember, (groupMember) => groupMember.group, {
    cascade: true,
  })
  members: GroupMember[];

  @OneToMany(() => Message, (message) => message.group)
  messages: Message[];

  @CreateDateColumn()
  timeSent: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

