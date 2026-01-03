import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Group } from './group.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  GIF = 'gif',
  FILE = 'file',
}

@Entity('messages')
@Index(['senderId', 'receiverId'])
@Index(['groupId'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  messageId: string;

  @Column()
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ nullable: true })
  receiverId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  @Column({ nullable: true })
  groupId: string;

  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column({ type: 'text', nullable: false })
  text: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({ default: false })
  isSeen: boolean;

  @Column({ type: 'varchar', length: 255, default: '', nullable: true })
  repliedMessage: string;

  @Column({ type: 'varchar', length: 255, default: '', nullable: true })
  repliedTo: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  repliedMessageType: MessageType;

  @CreateDateColumn()
  timeSent: Date;
}

