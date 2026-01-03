import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.createUser(
      req.user.phoneNumber,
      createUserDto.name,
      createUserDto.profilePic || '',
    );
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all users (except current)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getAllUsers(@Request() req) {
    return this.usersService.getAllUsers(req.user.uid);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  async getCurrentUser(@Request() req) {
    return this.usersService.getUserById(req.user.uid);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'List of matching users' })
  async searchUsers(@Query('q') query: string, @Request() req) {
    return this.usersService.searchUsers(query, req.user.uid);
  }

  @Get(':uid')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User data' })
  async getUser(@Param('uid') uid: string) {
    return this.usersService.getUserById(uid);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateCurrentUser(
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    return this.usersService.updateUser(req.user.uid, updateUserDto);
  }

  @Put('me/online')
  @ApiOperation({ summary: 'Set user online status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async setOnlineStatus(@Body() body: { isOnline: boolean }, @Request() req) {
    await this.usersService.setUserOnlineStatus(req.user.uid, body.isOnline);
    return { success: true };
  }
}

