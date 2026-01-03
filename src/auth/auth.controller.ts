import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendCodeDto, VerifyCodeDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send verification code' })
  @ApiResponse({ status: 200, description: 'Verification code sent' })
  async sendCode(@Body() sendCodeDto: SendCodeDto) {
    this.logger.log(`Received send-code request: ${JSON.stringify(sendCodeDto)}`);
    try {
      const result = await this.authService.sendVerificationCode(sendCodeDto.phoneNumber);
      this.logger.log(`Code sent successfully to ${sendCodeDto.phoneNumber}`);
      return result;
    } catch (error) {
      this.logger.error(`Error sending code: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify code and get JWT token' })
  @ApiResponse({ status: 200, description: 'Token and user data returned' })
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.authService.verifyCode(
      verifyCodeDto.phoneNumber,
      verifyCodeDto.code,
    );
  }
}

