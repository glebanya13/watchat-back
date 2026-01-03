import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Call } from '../entities/call.entity';
import { Message } from '../entities/message.entity';

export interface AdminStats {
  totalUsers: number;
  totalCalls: number;
  videoCalls: number;
  audioCalls: number;
  topCountries: Array<{ country: string; count: number }>;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Call)
    private callRepository: Repository<Call>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async getStats(): Promise<AdminStats> {
    // Total users (excluding admins and blocked)
    const totalUsers = await this.userRepository.count({
      where: { isAdmin: false, isBlocked: false },
    });

    // Total calls
    const totalCalls = await this.callRepository.count();

    // Video calls
    const videoCalls = await this.callRepository.count({
      where: { type: 'video' },
    });

    // Audio calls
    const audioCalls = await this.callRepository.count({
      where: { type: 'audio' },
    });

    // Top 5 countries (simplified - можно улучшить с реальной геолокацией)
    // Пока возвращаем заглушку, так как у нас нет данных о странах
    const topCountries = [
      { country: 'India', count: 0 },
      { country: 'United States', count: 0 },
      { country: 'Pakistan', count: 0 },
      { country: 'Bangladesh', count: 0 },
      { country: 'Turkey', count: 0 },
    ];

    return {
      totalUsers,
      totalCalls,
      videoCalls,
      audioCalls,
      topCountries,
    };
  }

  async getAllUsersForAdmin(): Promise<User[]> {
    // Возвращаем всех пользователей кроме админов
    return this.userRepository.find({
      where: { isAdmin: false },
      order: { createdAt: 'DESC' },
    });
  }

  async toggleUserBlock(uid: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { uid } });
    if (!user) {
      throw new Error('User not found');
    }
    if (user.isAdmin) {
      throw new Error('Cannot block admin user');
    }

    user.isBlocked = !user.isBlocked;
    return this.userRepository.save(user);
  }

  async setUserAsAdmin(uid: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { uid } });
    if (!user) {
      throw new Error('User not found');
    }

    user.isAdmin = true;
    return this.userRepository.save(user);
  }

  async getAdmins(): Promise<User[]> {
    return this.userRepository.find({
      where: { isAdmin: true },
      select: ['uid', 'name', 'phoneNumber', 'createdAt'],
    });
  }

  async checkIfAdminExists(): Promise<boolean> {
    const adminCount = await this.userRepository.count({
      where: { isAdmin: true },
    });
    return adminCount > 0;
  }

  async createFirstAdmin(phoneNumber: string, name: string): Promise<User> {
    // Проверяем, есть ли уже админы
    const adminExists = await this.checkIfAdminExists();
    if (adminExists) {
      throw new Error('Admin already exists');
    }

    const normalizedPhone = phoneNumber.replace(/\s+/g, '').replace(/\+/g, '');
    
    // Проверяем, существует ли пользователь
    let user = await this.userRepository.findOne({
      where: { uid: normalizedPhone },
    });

    if (!user) {
      // Создаем нового пользователя как админа
      user = this.userRepository.create({
        uid: normalizedPhone,
        phoneNumber,
        name,
        profilePic: '',
        isOnline: true,
        isAdmin: true,
        isBlocked: false,
      });
    } else {
      // Делаем существующего пользователя админом
      user.isAdmin = true;
    }

    return this.userRepository.save(user);
  }
}

