import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/messages.dto';
import { MessageType } from '../entities/message.entity';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async sendMessage(@Body() sendMessageDto: SendMessageDto, @Request() req) {
    return this.messagesService.sendMessage(
      req.user.uid,
      sendMessageDto.receiverId || null,
      sendMessageDto.groupId || null,
      sendMessageDto.text,
      sendMessageDto.type || MessageType.TEXT,
      sendMessageDto.repliedMessage || '',
      sendMessageDto.repliedTo || '',
      sendMessageDto.repliedMessageType || MessageType.TEXT,
    );
  }

  @Get('contacts')
  async getChatContacts(@Request() req) {
    return this.messagesService.getChatContacts(req.user.uid);
  }

  @Get('chat/:contactId')
  async getChatMessages(
    @Param('contactId') contactId: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
    @Request() req,
  ) {
    return this.messagesService.getChatMessages(
      req.user.uid,
      contactId,
      parseInt(limit),
      parseInt(offset),
    );
  }

  @Get('group/:groupId')
  async getGroupMessages(
    @Param('groupId') groupId: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
    @Request() req,
  ) {
    return this.messagesService.getGroupMessages(
      req.user.uid,
      groupId,
      parseInt(limit),
      parseInt(offset),
    );
  }

  @Put(':messageId/seen')
  async markMessageAsSeen(
    @Param('messageId') messageId: string,
    @Request() req,
  ) {
    await this.messagesService.markMessageAsSeen(messageId, req.user.uid);
    return { success: true };
  }

  @Put('chat/:contactId/seen')
  async markChatAsSeen(
    @Param('contactId') contactId: string,
    @Request() req,
  ) {
    await this.messagesService.markChatAsSeen(req.user.uid, contactId);
    return { success: true };
  }

  @Post('cleanup-errors')
  @ApiOperation({ summary: 'Delete error messages (messages starting with "Ошибка")' })
  async cleanupErrorMessages(@Request() req) {
    return this.messagesService.cleanupErrorMessages(req.user.uid);
  }
}

