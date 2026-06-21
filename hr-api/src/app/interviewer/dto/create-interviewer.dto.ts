import { IsString, IsArray, IsEmail, IsOptional, IsUUID } from "class-validator";
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

  @IsUUID()
  createdBy: string; // AdminUser ID (required for user-specific data isolation)

  @IsOptional()
  @IsUUID()
  organizationId?: string; // Optional — derived from admin's org if not provided
}
