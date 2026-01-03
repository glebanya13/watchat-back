import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('calls')
export class Call {
  @PrimaryColumn()
  callerId: string;

  @Column()
  callerName: string;

  @Column()
  callerPic: string;

  @Column()
  receiverId: string;

  @Column()
  receiverName: string;

  @Column()
  receiverPic: string;

  @Column()
  callId: string;

  @Column({ default: false })
  hasDialled: boolean;

  @Column({ default: 'audio' })
  type: 'audio' | 'video';

  @CreateDateColumn()
  createdAt: Date;
}

