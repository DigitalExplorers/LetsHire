import { Module } from '@nestjs/common';
import { AdminRoleService } from './admin-role.service';
import { AdminRoleController } from './admin-role.controller';

@Module({
  providers: [AdminRoleService],
  controllers: [AdminRoleController]
})
export class AdminRoleModule {}
