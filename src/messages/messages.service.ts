import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageType } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { Group } from '../entities/group.entity';

export interface ChatContact {
  name: string;
  profilePic: string;
  contactId: string;
  timeSent: Date;
  lastMessage: string;
}

@Injectable()
export class MessagesService {
  private chatGateway: any;

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
  ) {}

  setChatGateway(gateway: any) {
    this.chatGateway = gateway;
  }

  async sendMessage(
    senderId: string,
    receiverId: string | null,
    groupId: string | null,
    text: string,
    type: MessageType,
    repliedMessage: string = '',
    repliedTo: string = '',
    repliedMessageType: MessageType = MessageType.TEXT,
  ): Promise<Message> {
    // Проверяем, не заблокирован ли отправитель
    const sender = await this.userRepository.findOne({
      where: { uid: senderId },
    });

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    if (sender.isBlocked) {
      throw new ForbiddenException('Ваш аккаунт заблокирован. Вы не можете отправлять сообщения.');
    }

    const message = this.messageRepository.create({
      senderId,
      receiverId,
      groupId,
      text,
      type,
      isSeen: false,
      repliedMessage,
      repliedTo,
      repliedMessageType,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update last message for group
    if (groupId) {
      const lastMessage = this.formatLastMessage(savedMessage);
      await this.groupRepository.update(
        { groupId },
        { lastMessage },
      );
    }

    // Emit real-time event
    if (this.chatGateway) {
      if (receiverId) {
        this.chatGateway.emitNewMessage(receiverId, savedMessage);
      } else if (groupId) {
        this.chatGateway.emitGroupMessage(groupId, savedMessage);
      }
    }

    return savedMessage;
  }

  private formatLastMessage(message: Message): string {
    switch (message.type) {
      case MessageType.TEXT:
        return message.text;
      case MessageType.IMAGE:
        return '📷 Изображение';
      case MessageType.VIDEO:
        return '🎥 Видео';
      case MessageType.AUDIO:
        return '🎵 Аудио';
      case MessageType.GIF:
        return 'GIF';
      case MessageType.FILE:
        return '📎 Файл';
      default:
        return message.text || 'Сообщение';
    }
  }

  async getChatMessages(
    userId: string,
    contactId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Message[]> {
    // Возвращаем сообщения в порядке ASC (от старых к новым) для правильного отображения в чате
    return this.messageRepository.find({
      where: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId },
      ],
      order: { timeSent: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  async getGroupMessages(
    userId: string,
    groupId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Message[]> {
    // Проверяем что пользователь является членом группы
    const group = await this.groupRepository.findOne({
      where: { groupId },
      relations: ['members'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Проверяем членство
    const isMember = group.members.some((member) => member.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Вы не являетесь участником этой группы');
    }

    // Возвращаем сообщения в порядке ASC (от старых к новым) для правильного отображения в чате
    return this.messageRepository.find({
      where: { groupId },
      order: { timeSent: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  async getChatContacts(userId: string): Promise<ChatContact[]> {
    // Get all unique contacts from messages
    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .where('message.senderId = :userId OR message.receiverId = :userId', {
        userId,
      })
      .andWhere('message.groupId IS NULL')
      .orderBy('message.timeSent', 'DESC')
      .getMany();

    const contactMap = new Map<string, Message>();

    for (const message of messages) {
      const contactId =
        message.senderId === userId ? message.receiverId : message.senderId;
      // Проверяем, что contactId не null и не пустой, и что это не сам пользователь
      if (contactId && contactId !== userId && !contactMap.has(contactId)) {
        contactMap.set(contactId, message);
      }
    }

    const contacts: ChatContact[] = [];

    for (const [contactId, lastMessage] of contactMap) {
      const user = await this.userRepository.findOne({
        where: { uid: contactId },
      });
      // Исключаем админов и заблокированных пользователей
      if (user && !user.isAdmin && !user.isBlocked) {
        contacts.push({
          name: user.name,
          profilePic: user.profilePic,
          contactId,
          timeSent: lastMessage.timeSent,
          lastMessage: this.formatLastMessage(lastMessage),
        });
      }
    }

    return contacts.sort(
      (a, b) => b.timeSent.getTime() - a.timeSent.getTime(),
    );
  }

  async cleanupErrorMessages(userId: string): Promise<{ deleted: number }> {
    // Удаляем сообщения, которые начинаются с "Ошибка" или содержат "Exception"
    const result = await this.messageRepository
      .createQueryBuilder()
      .delete()
      .from(Message)
      .where('(senderId = :userId OR receiverId = :userId)', { userId })
      .andWhere(
        "(text LIKE 'Ошибка%' OR text LIKE 'Exception%' OR text LIKE 'Error%')",
      )
      .execute();

    return { deleted: result.affected || 0 };
  }

  async markMessageAsSeen(messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only mark as seen if user is the receiver
    if (message.receiverId === userId) {
      message.isSeen = true;
      await this.messageRepository.save(message);
      
      // Notify sender that message was seen
      if (this.chatGateway && message.senderId) {
        this.chatGateway.emitMessageSeen(message.senderId, messageId);
      }
    }
  }

  async markChatAsSeen(userId: string, contactId: string): Promise<void> {
    await this.messageRepository.update(
      {
        receiverId: userId,
        senderId: contactId,
        isSeen: false,
      },
      { isSeen: true },
    );
  }
}

