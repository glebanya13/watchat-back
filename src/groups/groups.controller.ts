import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGroupDto, UpdateGroupDto, AddMembersDto } from './dto/groups.dto';

@ApiTags('Groups')
@Controller('groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async createGroup(@Body() createGroupDto: CreateGroupDto, @Request() req) {
    return this.groupsService.createGroup(
      req.user.uid,
      createGroupDto.name,
      createGroupDto.groupPic || '',
      createGroupDto.memberUids,
    );
  }

  @Get()
  async getUserGroups(@Request() req) {
    return this.groupsService.getUserGroups(req.user.uid);
  }

  @Get(':groupId')
  async getGroup(@Param('groupId') groupId: string) {
    return this.groupsService.getGroupById(groupId);
  }

  @Put(':groupId')
  async updateGroup(
    @Param('groupId') groupId: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    return this.groupsService.updateGroup(groupId, updateGroupDto);
  }

  @Post(':groupId/members')
  async addMembers(
    @Param('groupId') groupId: string,
    @Body() addMembersDto: AddMembersDto,
  ) {
    await this.groupsService.addMembersToGroup(
      groupId,
      addMembersDto.memberUids,
    );
    return { success: true };
  }

  @Put(':groupId/members/:userId')
  async removeMember(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ) {
    await this.groupsService.removeMemberFromGroup(groupId, userId);
    return { success: true };
  }
}

