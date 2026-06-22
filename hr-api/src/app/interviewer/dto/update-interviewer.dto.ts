import { IsString, IsArray, IsOptional, IsUUID } from "class-validator";

export class UpdateInterviewerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  skills?: string[];

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  availability?: string;

  @IsOptional()
  @IsUUID()
  createdBy?: string; // AdminUser ID (required for user-specific data isolation)
}
