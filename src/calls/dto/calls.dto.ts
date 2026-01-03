import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video',
}

export class CreateCallDto {
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @IsString()
  @IsNotEmpty()
  callId: string;

  @IsBoolean()
  @IsOptional()
  hasDialled?: boolean;

  @IsEnum(CallType)
  @IsOptional()
  type?: CallType;
}

