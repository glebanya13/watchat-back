import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import axios from 'axios';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private telegramBot: Telegraf | null = null;

  constructor(private configService: ConfigService) {
    this.initializeTelegram();
  }

  private initializeTelegram() {
    const telegramToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (telegramToken) {
      this.telegramBot = new Telegraf(telegramToken);
      this.logger.log('Telegram bot initialized for fallback');
    }
  }

  /**
   * Отправляет код верификации на номер телефона пользователя через SMSC.RU
   */
  async sendVerificationCode(phoneNumber: string, code: string): Promise<void> {
    // Нормализуем номер телефона
    const normalizedPhone = phoneNumber.replace(/\s+/g, '').replace(/\+/g, '');

    const login = this.configService.get<string>('SMSC_LOGIN');
    const password = this.configService.get<string>('SMSC_PASSWORD');

    if (!login || !password) {
      this.logger.error('SMSC credentials not configured');
      throw new Error('SMSC credentials not configured');
    }

    const message = `Ваш код верификации WatChat: ${code}`;
    const url = 'https://smsc.ru/sys/send.php';
    
    const params = new URLSearchParams({
      login,
      psw: password,
      phones: normalizedPhone,
      mes: message,
      charset: 'utf-8',
      fmt: '3', // JSON format
    });

    try {
      this.logger.log(`Sending SMS to ${normalizedPhone} via SMSC.RU`);
      this.logger.log(`SMSC login: ${login}`);
      this.logger.log(`Request URL: ${url}?${params.toString().replace(/psw=[^&]+/, 'psw=***')}`);
      
      const response = await axios.get(`${url}?${params.toString()}`, {
        timeout: 10000,
      });
      
      this.logger.log(`SMSC response: ${JSON.stringify(response.data)}`);
      
      // SMSC.RU возвращает ошибку в поле error или error_code
      if (response.data.error || response.data.error_code) {
        const errorMsg = response.data.error || response.data.error_code;
        const errorText = response.data.error_text || 'Unknown error';
        this.logger.error(`SMSC error: ${errorMsg} - ${errorText}`);
        this.logger.error(`Full SMSC response: ${JSON.stringify(response.data)}`);
        
        // Если IP заблокирован, пробуем отправить через Telegram
        const errorString = `${errorMsg} ${errorText}`.toLowerCase();
        if (errorString.includes('ip is blocked') || 
            errorString.includes('blocked') || 
            errorString.includes('ip') ||
            errorString.includes('адрес')) {
          this.logger.warn('SMSC IP is blocked, trying Telegram fallback');
          this.logger.warn('NOTE: If you added IP to whitelist, wait a few minutes for changes to apply');
          await this.sendViaTelegram(phoneNumber, code);
          return;
        }
        
        throw new Error(`SMSC error: ${errorMsg} - ${errorText}`);
      }

      // Проверяем наличие id в ответе (успешная отправка)
      if (!response.data.id && !response.data.cnt) {
        this.logger.warn(`Unexpected SMSC response format: ${JSON.stringify(response.data)}`);
      }

      this.logger.log(`SMS sent successfully via SMSC.RU to ${phoneNumber}`);
    } catch (error) {
      if (error.response) {
        // Ошибка HTTP запроса
        this.logger.error(`HTTP error sending SMS: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        
        // Если IP заблокирован, пробуем Telegram
        if (error.response.data?.error?.includes('ip is blocked') || 
            error.response.data?.error?.includes('blocked')) {
          this.logger.warn('SMSC IP is blocked, trying Telegram fallback');
          await this.sendViaTelegram(phoneNumber, code);
          return;
        }
        
        throw new Error(`Failed to send SMS: HTTP ${error.response.status}`);
      } else if (error.request) {
        // Запрос был отправлен, но ответа не получено
        this.logger.error(`No response from SMSC: ${error.message}`);
        this.logger.warn('Trying Telegram fallback');
        await this.sendViaTelegram(phoneNumber, code);
        return;
      } else {
        // Ошибка при настройке запроса
        this.logger.error(`Error sending SMS to ${phoneNumber}: ${error.message}`, error.stack);
        throw error;
      }
    }
  }

  /**
   * Отправка через Telegram (fallback)
   */
  private async sendViaTelegram(phoneNumber: string, code: string): Promise<void> {
    if (!this.telegramBot) {
      throw new Error('Telegram bot not initialized and SMSC failed');
    }

    const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');
    if (!chatId) {
      throw new Error('TELEGRAM_CHAT_ID not configured and SMSC failed');
    }

    try {
      await this.telegramBot.telegram.sendMessage(
        chatId,
        `🔐 Код верификации WatChat: ${code}\n📱 Номер телефона: ${phoneNumber}\n\n⚠️ Примечание: SMS не отправлено через SMSC (IP заблокирован), код отправлен в Telegram.`,
      );
      this.logger.log(`Verification code sent via Telegram (fallback) to ${phoneNumber}`);
    } catch (error) {
      this.logger.error('Error sending Telegram message:', error);
      throw new Error('Failed to send code via both SMSC and Telegram');
    }
  }
}

