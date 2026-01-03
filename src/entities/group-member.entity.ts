import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { User } from './user.entity';

@Entity('group_members')
export class GroupMember {
  @PrimaryColumn()
  groupId: string;

  @ManyToOne(() => Group, (group) => group.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @PrimaryColumn()
  userId: string;

  @ManyToOne(() => User, (user) => user.groupMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

