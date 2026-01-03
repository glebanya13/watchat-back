import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { VerificationCode } from '../entities/verification-code.entity';
import { User } from '../entities/user.entity';
import { VerificationService } from './verification.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(VerificationCode)
    private verificationCodeRepository: Repository<VerificationCode>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private verificationService: VerificationService,
    private jwtService: JwtService,
  ) {}

  normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/\s+/g, '').replace(/\+/g, '');
  }

  async sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    
    // TEST MODE: Use fixed code 111111 for all numbers
    const code = '111111';
    
    // Save verification code
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    const existingCode = await this.verificationCodeRepository.findOne({
      where: { phoneNumber: normalizedPhone },
    });

    if (existingCode) {
      existingCode.code = code;
      existingCode.isVerified = false;
      existingCode.expiresAt = expiresAt;
      await this.verificationCodeRepository.save(existingCode);
    } else {
      const verificationCode = this.verificationCodeRepository.create({
        phoneNumber: normalizedPhone,
        code,
        isVerified: false,
        expiresAt,
      });
      await this.verificationCodeRepository.save(verificationCode);
    }

    return {
      success: true,
      message: 'Verification code sent (test mode: use 111111)',
    };
  }

  async verifyCode(phoneNumber: string, code: string): Promise<{ token: string; user: User | null }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    const verificationCode = await this.verificationCodeRepository.findOne({
      where: { phoneNumber: normalizedPhone },
    });

    if (!verificationCode) {
      throw new UnauthorizedException('Verification code not found');
    }

    if (verificationCode.isVerified) {
      throw new BadRequestException('Code already used');
    }

    if (new Date() > verificationCode.expiresAt) {
      throw new UnauthorizedException('Verification code expired');
    }

    if (code === '111111') {
    } else if (verificationCode.code !== code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Mark code as verified
    verificationCode.isVerified = true;
    await this.verificationCodeRepository.save(verificationCode);

    // Check if user exists
    let user = await this.userRepository.findOne({
      where: { uid: normalizedPhone },
    });

    // Generate JWT token
    const payload = { phoneNumber: normalizedPhone, uid: normalizedPhone };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user,
    };
  }

  async validateUser(phoneNumber: string): Promise<User | null> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    return this.userRepository.findOne({
      where: { uid: normalizedPhone },
    });
  }
}

