import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Organization } from '../organization/entities/organization.entity';
import { AdminUser } from '../users/entities/users.entity';
import { SuperAdminSeeder } from './super-admin.seed';
import { Role } from '../role/entities/role.entity';
import { UserRole } from '../user-role/entities/user.role.entity';
import { Interviewer } from '../interviewer/entities/interviewer.entity';
import { Interview } from '../interview/entities/interview.entity';
import { Candidate } from '../candidate/entities/candidate.entity';
import { RegistrationLink } from '../registration-link/entities/registration-link.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Organization,
      AdminUser,
      Role,
      UserRole,
      Interviewer,
      Interview,
      Candidate,
      RegistrationLink,
    ]),
  ],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, SuperAdminSeeder],
  exports: [SuperAdminSeeder],
})
export class SuperAdminModule {}


