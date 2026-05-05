import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CandidateModule } from './app/candidate/candidate.module';
import { AuthModule } from './app/auth/auth.module';
import { VideoModule } from './app/video/video.module';
import { VideoService } from './app/video/video.service';
import { QuizModule } from './app/quiz/quiz.module';
import { AuthController } from './app/auth/auth.controller';
import { AuthService } from './app/auth/auth.service';
import { UsersModule } from './app/users/users.module';
import { MailerModule } from './app/mailer/mailer.module';
import { CandidateFeedbackModule } from './app/candidate-feedback/candidate-feedback.module';
import { InterviewerModule } from './app/interviewer/interviewer.module';
import { InterviewModule } from './app/interview/interview.module';
import { UserRoleModule } from './app/user-role/user-role.module';
import { RegistrationLinkModule } from './app/registration-link/registration-link.module';
import { OrganizationModule } from './app/organization/organization.module';
import { AdminRoleModule } from './app/admin-role/admin-role.module';
import { SuperAdminModule } from './app/super-admin/super-admin.module';
import { RoleModule } from './app/role/role.module';
import { BedrockModule } from './app/bedrock/bedrock.module';
import { getDatabaseOptions } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: ['.env', '.env.development'],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...getDatabaseOptions(process.env),

        // Let feature modules keep registering entities via forFeature([...]).
        autoLoadEntities: true,
        logging: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),

    CandidateModule,
    AuthModule,
    VideoModule,
    QuizModule,
    UsersModule,
    MailerModule,
    CandidateFeedbackModule,
    InterviewerModule,
    InterviewModule,
    UserRoleModule,
    RegistrationLinkModule,
    OrganizationModule,
    AdminRoleModule,
    SuperAdminModule,
    RoleModule,
    BedrockModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    VideoService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
