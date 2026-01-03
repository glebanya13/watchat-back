import { IsArray, IsString, IsOptional } from 'class-validator';

export class CreateStatusDto {
  @IsArray()
  @IsString({ each: true })
  photoUrls: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  whoCanSee?: string[];
}

