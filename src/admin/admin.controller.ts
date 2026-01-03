import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('check-admin')
  @ApiOperation({ summary: 'Check if admin exists (public endpoint)' })
  @ApiResponse({ status: 200, description: 'Admin status' })
  async checkAdmin() {
    const exists = await this.adminService.checkIfAdminExists();
    return { adminExists: exists };
  }

  @Post('create-first-admin')
  @ApiOperation({ summary: 'Create first admin (public endpoint, only if no admin exists)' })
  @ApiResponse({ status: 201, description: 'First admin created' })
  async createFirstAdmin(@Body() body: { phoneNumber: string; name: string }) {
    return this.adminService.createFirstAdmin(body.phoneNumber, body.name);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get admin statistics' })
  @ApiResponse({ status: 200, description: 'Statistics returned' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all users for admin (excluding admins)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getAllUsers() {
    return this.adminService.getAllUsersForAdmin();
  }

  @Put('users/:uid/block')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle user block status' })
  @ApiResponse({ status: 200, description: 'User block status toggled' })
  async toggleUserBlock(@Param('uid') uid: string) {
    return this.adminService.toggleUserBlock(uid);
  }

  @Put('users/:uid/make-admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Make user an admin' })
  @ApiResponse({ status: 200, description: 'User made admin' })
  async makeAdmin(@Param('uid') uid: string) {
    return this.adminService.setUserAsAdmin(uid);
  }

  @Get('admins')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all administrators' })
  @ApiResponse({ status: 200, description: 'List of administrators' })
  async getAdmins() {
    return this.adminService.getAdmins();
  }
}

