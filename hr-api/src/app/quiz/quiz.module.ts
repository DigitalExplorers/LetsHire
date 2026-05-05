import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { Quiz } from './entities/quiz.entity';
import { Option } from './entities/option.entity';
import { Score } from './entities/score.entity';
import { Candidate } from '../candidate/entities/candidate.entity';
import { QuizConfig } from './entities/quiz-config.entity';
import { QuizSeeder } from './quiz.seed';
import { UserRoleModule } from '../user-role/user-role.module';
import { AuthModule } from '../auth/auth.module';
import { AdminUser } from '../users/entities/users.entity';
import { UserRole } from '../user-role/entities/user.role.entity';
import { CandidateTestAttempt } from './entities/candidate-test-attempt.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quiz, Option, Score, Candidate, QuizConfig, AdminUser, UserRole, CandidateTestAttempt]), UserRoleModule, AuthModule],
  controllers: [QuizController],
  providers: [QuizService, QuizSeeder],
})
export class QuizModule {}

