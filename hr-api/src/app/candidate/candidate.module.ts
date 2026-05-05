import { forwardRef, Module } from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from './entities/candidate.entity';
import { CandidateController } from './candidate.controller';
import { MailerModule } from '../mailer/mailer.module';
import { Interviewer } from '../interviewer/entities/interviewer.entity';
import { InterviewerModule } from '../interviewer/interviewer.module';
import { Interview } from '../interview/entities/interview.entity';
import { InterviewModule } from '../interview/interview.module';
import { S3Service } from '../services/s3.service';
import { ScheduleModule } from '@nestjs/schedule'; // Import ScheduleModule
import { UserRole } from '../user-role/entities/user.role.entity';
import { AuthModule } from '../auth/auth.module';
import { Organization } from '../organization/entities/organization.entity';
import { CandidateTestAttempt } from '../quiz/entities/candidate-test-attempt.entity';
import { RegistrationLinkModule } from '../registration-link/registration-link.module';
import { CandidateNotificationService } from './candidate-notification.service';
import { CandidateDocumentService } from './candidate-document.service';

@Module({
  imports: [TypeOrmModule.forFeature([Candidate, Interviewer, Interview, UserRole, Organization, CandidateTestAttempt]), MailerModule, InterviewerModule, forwardRef(() => InterviewModule), ScheduleModule.forRoot(),AuthModule, RegistrationLinkModule],
  providers: [CandidateService, CandidateNotificationService, CandidateDocumentService, S3Service],
  exports: [CandidateService, TypeOrmModule, S3Service],
  controllers: [CandidateController],
})
export class CandidateModule {}
