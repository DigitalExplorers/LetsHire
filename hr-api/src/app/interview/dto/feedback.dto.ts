import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class FeedbackDto {
  @IsNotEmpty()
  @IsUUID()
  candidateId: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  round: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  score: number;

  @IsString()
  strengths: string;

  @IsString()
  weaknesses: string;

  @IsString()
  comments: string;
}
