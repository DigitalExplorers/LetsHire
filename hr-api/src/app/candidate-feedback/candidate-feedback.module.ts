import { Module } from '@nestjs/common';
import { CandidateFeedbackService } from './candidate-feedback.service';
import { CandidateFeedbackController } from './candidate-feedback.controller';
import { Feedback } from './entities/feedback.entity';
import { Candidate } from '../candidate/entities/candidate.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from '../users/entities/users.entity'; // Recruiters/Admin entity

@Module({
  imports: [TypeOrmModule.forFeature([Feedback, Candidate, AdminUser])], 
  providers: [CandidateFeedbackService], 
  controllers: [CandidateFeedbackController], 
  exports: [CandidateFeedbackService],
})
export class CandidateFeedbackModule {}
