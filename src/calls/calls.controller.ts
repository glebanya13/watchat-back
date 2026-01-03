import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCallDto } from './dto/calls.dto';

@ApiTags('Calls')
@Controller('calls')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  async createCall(@Body() createCallDto: CreateCallDto, @Request() req) {
    return this.callsService.createCall(
      req.user.uid,
      createCallDto.receiverId,
      createCallDto.callId,
      createCallDto.hasDialled || false,
      createCallDto.type || 'audio',
    );
  }

  @Get()
  async getCall(@Request() req) {
    return this.callsService.getCall(req.user.uid);
  }

  @Delete(':receiverId')
  async endCall(
    @Param('receiverId') receiverId: string,
    @Request() req,
  ) {
    await this.callsService.endCall(req.user.uid, receiverId);
    return { success: true };
  }

  @Delete('group/:groupId')
  async endGroupCall(
    @Param('groupId') groupId: string,
    @Request() req,
  ) {
    await this.callsService.endGroupCall(req.user.uid, groupId);
    return { success: true };
  }
}

