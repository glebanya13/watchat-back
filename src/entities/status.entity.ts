import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('statuses')
export class Status {
  @PrimaryGeneratedColumn('uuid')
  statusId: string;

  @Column()
  uid: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uid' })
  user: User;

  @Column()
  username: string;

  @Column()
  phoneNumber: string;

  @Column('simple-array')
  photoUrl: string[];

  @Column('simple-array', { nullable: true })
  whoCanSee: string[];

  @Column()
  profilePic: string;

  @CreateDateColumn()
  createdAt: Date;
}

