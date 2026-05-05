import { IsEmail, IsOptional, IsString, IsUrl, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateOrganizationDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  logoUrl?: string;

  @IsOptional()
  primaryColor?: string;

  @IsOptional()
  bgImageUrl?: string;

  @IsOptional()
  @IsString()
  policy?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended'])
  status?: 'active' | 'inactive' | 'suspended';
}

