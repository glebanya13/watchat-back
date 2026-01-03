import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Call } from '../entities/call.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class CallsService {
  private chatGateway: any;

  constructor(
    @InjectRepository(Call)
    private callRepository: Repository<Call>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  setChatGateway(gateway: any) {
    this.chatGateway = gateway;
  }

  async createCall(
    callerId: string,
    receiverId: string,
    callId: string,
    hasDialled: boolean,
    type: 'audio' | 'video' = 'audio',
  ): Promise<{ callerCall: Call; receiverCall: Call }> {
    const caller = await this.userRepository.findOne({
      where: { uid: callerId },
    });
    const receiver = await this.userRepository.findOne({
      where: { uid: receiverId },
    });

    if (!caller || !receiver) {
      throw new NotFoundException('User not found');
    }

    const callerCall = this.callRepository.create({
      callerId,
      callerName: caller.name,
      callerPic: caller.profilePic,
      receiverId,
      receiverName: receiver.name,
      receiverPic: receiver.profilePic,
      callId,
      hasDialled,
      type,
    });

    const receiverCall = this.callRepository.create({
      callerId,
      callerName: caller.name,
      callerPic: caller.profilePic,
      receiverId,
      receiverName: receiver.name,
      receiverPic: receiver.profilePic,
      callId,
      hasDialled: false,
      type,
    });

    const savedCallerCall = await this.callRepository.save(callerCall);
    const savedReceiverCall = await this.callRepository.save(receiverCall);

    // Emit real-time call event
    if (this.chatGateway) {
      this.chatGateway.emitNewCall(receiverId, savedReceiverCall);
    }

    return {
      callerCall: savedCallerCall,
      receiverCall: savedReceiverCall,
    };
  }

  async getCall(userId: string): Promise<Call | null> {
    return this.callRepository.findOne({
      where: { callerId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async endCall(callerId: string, receiverId: string): Promise<void> {
    await this.callRepository.delete({ callerId });
    await this.callRepository.delete({ receiverId });
    
    // Emit call ended events
    if (this.chatGateway) {
      this.chatGateway.emitCallEnded(callerId);
      this.chatGateway.emitCallEnded(receiverId);
    }
  }

  async endGroupCall(callerId: string, groupId: string): Promise<void> {
    // For group calls, we need to delete all calls for group members
    // This is a simplified version - in production you'd track group members
    await this.callRepository.delete({ callerId });
    // Additional logic for group members would go here
  }
}

