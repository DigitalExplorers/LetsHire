import { Module } from '@nestjs/common';
import { UserRoleService } from './user-role.service';
import { UserRoleController } from './user-role.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from './entities/user.role.entity';
import { UserRoleSeeder } from './user-role.seed';
import { AdminUser } from '../users/entities/users.entity';
import { BedrockModule } from '../bedrock/bedrock.module';
import { Quiz } from '../quiz/entities/quiz.entity';
import { Option } from '../quiz/entities/option.entity';
import { QuizConfig } from '../quiz/entities/quiz-config.entity';
import { QuizService } from '../quiz/quiz.service';
import { Score } from '../quiz/entities/score.entity';
import { Candidate } from '../candidate/entities/candidate.entity';
import { CandidateTestAttempt } from '../quiz/entities/candidate-test-attempt.entity';
import { RegistrationLink } from '../registration-link/entities/registration-link.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserRole, AdminUser, Quiz, Option, Score, Candidate, QuizConfig, CandidateTestAttempt, RegistrationLink]),BedrockModule],  // Register UserRole Repository
  providers: [UserRoleService, UserRoleSeeder, QuizService],
  controllers: [UserRoleController],
  exports: [UserRoleService, TypeOrmModule],
})
export class UserRoleModule {}
