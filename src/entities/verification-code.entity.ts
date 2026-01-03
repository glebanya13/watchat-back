import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('verification_codes')
@Index(['phoneNumber', 'code'])
export class VerificationCode {
  @PrimaryColumn()
  phoneNumber: string;

  @Column()
  code: string;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;
}

