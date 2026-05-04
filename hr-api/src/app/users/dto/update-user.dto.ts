import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminUserDto } from './create-user.dto';

export class UpdateCandidateDto extends PartialType(CreateAdminUserDto) {}
