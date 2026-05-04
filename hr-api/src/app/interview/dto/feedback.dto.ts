import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FeedbackDto {
  @Type(() => Number) // Converts string to number automatically
  @IsNumber()
  @IsNotEmpty()
  candidateId: number;

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
