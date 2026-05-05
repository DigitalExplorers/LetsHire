import { Type, Exclude } from 'class-transformer';
import { IsEmail, IsNotEmpty, MaxLength, MinLength, IsOptional, IsJSON, IsString } from 'class-validator';


export class CreateCandidateDto {
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(50, { message: 'First name must be shorter than or equal to 50 characters' })
  firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(50, { message: 'Last name must be shorter than or equal to 50 characters' })
  lastName: string;

  @IsOptional()
  @MaxLength(10, { message: 'Country code must be shorter than or equal to 10 characters' })
  countryCode: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @MinLength(10, { message: 'Phone number must be at least 10 characters' })
  @MaxLength(15, { message: 'Phone number must be shorter than or equal to 15 characters' })
  phoneNumber: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsOptional()
  qualification: string;
    
  @IsOptional()
  @Type(() => Number) 
  yearOfPassedOut: number;

  @IsOptional()
  @Type(() => Number) 
  passPercentage: number;

  @IsOptional()
  currentCity: string;

  @IsOptional()
  desiredRole: string;

  @IsOptional()
  @Type(() => Number)
  workExperience: number;

  @IsOptional()
  @IsString()
  resume?: string;  // Store file path

  @IsOptional()
  @IsString()
  idProof?: string; // Store file path

  @Exclude()
  otp: number;

  // New Fields for Video Analysis
  @IsOptional()
  videoPath: string;

  @IsOptional()
  @IsJSON()
  videoAnalysis: any;

  @IsOptional()
  @Type(() => Object)
  adminUser?: { id: number };

  @IsOptional()
  @Type(() => Object)
  organization?: { id: number };

}
