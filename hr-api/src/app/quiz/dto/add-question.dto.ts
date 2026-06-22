// dto/add-question.dto.ts
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OptionDto } from './option.dto';

export class AddQuestionDto {
  @IsString()
  question: string;

  @IsString() // or @IsUUID() if roleId is a UUID
  roleId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options: OptionDto[];
}