import { Module } from '@nestjs/common';
import { BedrockController } from './bedrock.controller';
import { BedrockService } from './bedrock.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from '../user-role/entities/user.role.entity';
import { AdminUser } from '../users/entities/users.entity';
import { Quiz } from '../quiz/entities/quiz.entity';
import { Option } from '../quiz/entities/option.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserRole, AdminUser, Quiz, Option]),AuthModule],
  controllers: [BedrockController],
  providers: [BedrockService],
  exports: [BedrockService],
})
export class BedrockModule {}
