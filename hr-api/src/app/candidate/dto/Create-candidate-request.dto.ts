import { IsNotEmpty, IsString } from 'class-validator';
import { CreateCandidateDto } from './create-candidate.dto';

export class CreateCandidateRequestDto extends CreateCandidateDto {
  @IsNotEmpty({ message: 'Admin ID is required' })
  @IsString()
  adminId: string;

  @IsNotEmpty({ message: 'Organization ID is required' })
  @IsString()
  organizationId: string;
}