import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminUser } from '../users/entities/users.entity';
import { Organization } from '../organization/entities/organization.entity';
import { Role } from '../role/entities/role.entity';
import { Interviewer } from '../interviewer/entities/interviewer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser, Organization, Role, Interviewer])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule], // Ensure UsersService is exported
})
export class UsersModule {}
