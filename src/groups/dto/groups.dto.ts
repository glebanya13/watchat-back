import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  groupPic?: string;

  @IsArray()
  @IsString({ each: true })
  memberUids: string[];
}

export class UpdateGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  groupPic?: string;
}

export class AddMembersDto {
  @IsArray()
  @IsString({ each: true })
  memberUids: string[];
}

