import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/\s+/g, '').replace(/\+/g, '');
  }

  async createUser(
    phoneNumber: string,
    name: string,
    profilePic: string = '',
  ): Promise<User> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // Проверяем, есть ли уже пользователи в системе
    const userCount = await this.userRepository.count();
    // Первый пользователь автоматически становится админом
    const isAdmin = userCount === 0;

    const user = this.userRepository.create({
      uid: normalizedPhone,
      phoneNumber,
      name,
      profilePic,
      isOnline: true,
      isAdmin,
      isBlocked: false,
    });

    return this.userRepository.save(user);
  }

  async getUserById(uid: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { uid } });
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    return this.userRepository.findOne({ where: { uid: normalizedPhone } });
  }

  async updateUser(
    uid: string,
    updateData: Partial<Pick<User, 'name' | 'profilePic'>>,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { uid } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async setUserOnlineStatus(uid: string, isOnline: boolean): Promise<void> {
    await this.userRepository.update({ uid }, { isOnline });
  }

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.uid != :currentUserId', { currentUserId })
      .andWhere('user.isAdmin = false') // Исключаем админов
      .andWhere('user.isBlocked = false') // Исключаем заблокированных
      .andWhere(
        '(user.name ILIKE :query OR user.phoneNumber ILIKE :query)',
        { query: `%${query}%` },
      )
      .limit(20)
      .getMany();
  }

  async getAllUsers(currentUserId: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.uid != :currentUserId', { currentUserId })
      .andWhere('user.isAdmin = false') // Исключаем админов
      .andWhere('user.isBlocked = false') // Исключаем заблокированных
      .orderBy('user.name', 'ASC')
      .getMany();
  }
}

