import { IsString, IsArray, IsOptional, IsInt } from "class-validator";

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

  @IsInt()
  createdBy: number; // AdminUser ID (required for user-specific data isolation)
}
