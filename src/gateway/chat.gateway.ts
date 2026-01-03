import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { MessagesService } from '../messages/messages.service';
import { CallsService } from '../calls/calls.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
    private messagesService: MessagesService,
    private callsService: CallsService,
  ) {}

  onModuleInit() {
    // Set gateway reference in services
    this.messagesService.setChatGateway(this);
    this.callsService.setChatGateway(this);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      // Проверяем существование пользователя для WebSocket соединения
      const user = await this.authService.validateUser(payload.phoneNumber);
      
      if (!user) {
        client.disconnect();
        return;
      }

      // Проверяем, не заблокирован ли пользователь
      if (user.isBlocked) {
        client.disconnect();
        return;
      }

      client.userId = user.uid;
      this.userSockets.set(user.uid, client.id);

      // Notify user is online
      client.broadcast.emit('user-online', { userId: user.uid });
    } catch (error) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.userSockets.delete(client.userId);
      // Notify user is offline
      client.broadcast.emit('user-offline', { userId: client.userId });
    }
  }

  @SubscribeMessage('join-chat')
  handleJoinChat(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { contactId: string }) {
    client.join(`chat:${client.userId}:${data.contactId}`);
    client.join(`chat:${data.contactId}:${client.userId}`);
  }

  @SubscribeMessage('leave-chat')
  handleLeaveChat(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { contactId: string }) {
    client.leave(`chat:${client.userId}:${data.contactId}`);
    client.leave(`chat:${data.contactId}:${client.userId}`);
  }

  @SubscribeMessage('join-group')
  handleJoinGroup(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { groupId: string }) {
    client.join(`group:${data.groupId}`);
  }

  @SubscribeMessage('leave-group')
  handleLeaveGroup(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { groupId: string }) {
    client.leave(`group:${data.groupId}`);
  }

  // Helper methods to emit events
  emitNewMessage(receiverId: string, message: any) {
    const socketId = this.userSockets.get(receiverId);
    if (socketId) {
      this.server.to(socketId).emit('new-message', message);
    }
  }

  emitGroupMessage(groupId: string, message: any) {
    this.server.to(`group:${groupId}`).emit('new-group-message', message);
  }

  emitMessageSeen(senderId: string, messageId: string) {
    const socketId = this.userSockets.get(senderId);
    if (socketId) {
      this.server.to(socketId).emit('message-seen', { messageId });
    }
  }

  emitNewCall(receiverId: string, call: any) {
    const socketId = this.userSockets.get(receiverId);
    if (socketId) {
      this.server.to(socketId).emit('new-call', call);
    }
  }

  emitCallEnded(userId: string) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('call-ended');
    }
  }
}

