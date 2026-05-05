import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { Organization } from './entities/organization.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3Service } from '../services/s3.service';
import { AdminUser } from '../users/entities/users.entity';
import { Candidate } from '../candidate/entities/candidate.entity';
import { UserRole } from '../user-role/entities/user.role.entity';
import { Quiz } from '../quiz/entities/quiz.entity';
import { QuizConfig } from '../quiz/entities/quiz-config.entity';
import { Interviewer } from '../interviewer/entities/interviewer.entity';
import { Interview } from '../interview/entities/interview.entity';
import { RegistrationLink } from '../registration-link/entities/registration-link.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      AdminUser,
      Candidate,
      UserRole,
      Quiz,
      QuizConfig,
      Interviewer,
      Interview,
      RegistrationLink,
    ]),
  ],
  providers: [OrganizationService,S3Service],
  controllers: [OrganizationController],
  exports: [OrganizationService, TypeOrmModule,S3Service],
})
export class OrganizationModule {}
