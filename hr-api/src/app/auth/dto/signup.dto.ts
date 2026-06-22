import { IsEmail, IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @IsNotEmpty()
  @Matches(/^[a-zA-Z\s]+$/, {
  message: 'Name can only contain letters and spaces',
  })
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  organizationName: string;

  @IsNotEmpty()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @Matches(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
  {
    message:
      'Password must contain uppercase, lowercase, number and special character',
  },)
  password: string;
}
