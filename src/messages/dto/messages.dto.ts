import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { MessageType } from '../../entities/message.entity';

export class SendMessageDto {
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.groupId)
  receiverId?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.receiverId)
  groupId?: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @IsString()
  @IsOptional()
  repliedMessage?: string;

  @IsString()
  @IsOptional()
  repliedTo?: string;

  @IsEnum(MessageType)
  @IsOptional()
  repliedMessageType?: MessageType;
}

