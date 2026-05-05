import { IsEmail, IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateSubUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsIn(['hr', 'interviewer'])
  role: string;
}
