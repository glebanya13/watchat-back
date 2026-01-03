import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from '../entities/status.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(Status)
    private statusRepository: Repository<Status>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createStatus(
    uid: string,
    photoUrls: string[],
    whoCanSee: string[] = [],
  ): Promise<Status> {
    const user = await this.userRepository.findOne({ where: { uid } });
    if (!user) {
      throw new Error('User not found');
    }

    const status = this.statusRepository.create({
      uid,
      username: user.name,
      phoneNumber: user.phoneNumber,
      photoUrl: photoUrls,
      profilePic: user.profilePic,
      whoCanSee: whoCanSee.length > 0 ? whoCanSee : null,
    });

    return this.statusRepository.save(status);
  }

  async getUserStatuses(uid: string): Promise<Status[]> {
    return this.statusRepository.find({
      where: { uid },
      order: { createdAt: 'DESC' },
    });
  }

  async getStatusesForUser(userId: string): Promise<Status[]> {
    // Get statuses from contacts that user can see
    // This is a simplified version - in production you'd filter by whoCanSee
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    return this.statusRepository
      .createQueryBuilder('status')
      .where('status.createdAt > :oneDayAgo', { oneDayAgo })
      .andWhere('status.uid != :userId', { userId })
      .orderBy('status.createdAt', 'DESC')
      .getMany();
  }

  async deleteStatus(statusId: string, userId: string): Promise<void> {
    const status = await this.statusRepository.findOne({
      where: { statusId, uid: userId },
    });

    if (status) {
      await this.statusRepository.remove(status);
    }
  }
}

