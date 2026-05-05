import { IsString, IsArray, IsEmail, IsOptional, IsInt } from "class-validator";

export class CreateInterviewerDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsArray()
  skills: string[];  // ["React", "Java", "AWS"]

  @IsString()
  department: string;

  @IsOptional()
  @IsString()
  availability?: string; // Default: Available

  @IsInt()
  createdBy: number; // AdminUser ID (required for user-specific data isolation)

  @IsOptional()
  @IsInt()
  organizationId?: number; // Optional — derived from admin's org if not provided
}
