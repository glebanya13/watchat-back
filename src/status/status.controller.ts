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
import { StatusService } from './status.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStatusDto } from './dto/status.dto';

@ApiTags('Status')
@Controller('status')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Post()
  async createStatus(@Body() createStatusDto: CreateStatusDto, @Request() req) {
    return this.statusService.createStatus(
      req.user.uid,
      createStatusDto.photoUrls,
      createStatusDto.whoCanSee || [],
    );
  }

  @Get('me')
  async getMyStatuses(@Request() req) {
    return this.statusService.getUserStatuses(req.user.uid);
  }

  @Get()
  async getStatuses(@Request() req) {
    return this.statusService.getStatusesForUser(req.user.uid);
  }

  @Delete(':statusId')
  async deleteStatus(@Param('statusId') statusId: string, @Request() req) {
    await this.statusService.deleteStatus(statusId, req.user.uid);
    return { success: true };
  }
}

