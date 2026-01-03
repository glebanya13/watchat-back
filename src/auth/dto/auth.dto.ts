import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class SendCodeDto {
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Phone number must be 10-15 digits, optionally starting with +',
  })
  phoneNumber: string;
}

export class VerifyCodeDto {
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Phone number must be 10-15 digits, optionally starting with +',
  })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, {
    message: 'Code must be 6 digits',
  })
  code: string;
}

