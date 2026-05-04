import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationLink } from './entities/registration-link.entity';
import { RegistrationLinkService } from './registration-link.service';
import { RegistrationLinkController } from './registration-link.controller';
import { AdminUser } from '../users/entities/users.entity';
import { UserRole } from '../user-role/entities/user.role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RegistrationLink, AdminUser, UserRole])],
  controllers: [RegistrationLinkController],
  providers: [RegistrationLinkService],
  exports: [RegistrationLinkService],
})
export class RegistrationLinkModule {}
