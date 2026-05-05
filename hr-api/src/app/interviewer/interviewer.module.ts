import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interviewer } from './entities/interviewer.entity';
import { InterviewerService } from './interviewer.service';
import { InterviewerController } from './interviewer.controller';
import { CandidateModule } from '../candidate/candidate.module';
import { AdminUser } from '../users/entities/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Interviewer, AdminUser]), forwardRef(() => CandidateModule),],
  providers: [InterviewerService],
  controllers: [InterviewerController],
  exports: [InterviewerService],
})
export class InterviewerModule {}
