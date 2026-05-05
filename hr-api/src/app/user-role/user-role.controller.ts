import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Delete,
  Put,
} from '@nestjs/common';
import { UserRoleService } from './user-role.service';
import { UserRoleSeeder } from './user-role.seed';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard) 
export class UserRoleController {
  constructor(
    private readonly roleService: UserRoleService,
    private readonly userRoleSeeder: UserRoleSeeder,
  ) {}

  @Get()
  async getAllRoles(
    @CurrentUser() adminUser: { userId: number },
  ) {
    return this.roleService.getAllRoles(adminUser.userId);
  }

  @Get(':id')
  async getRoleById(
    @Param('id') id: number,
    @CurrentUser() adminUser: { userId: number }
  ) {
    return this.roleService.getRoleById(id, adminUser.userId);
  }

  @Get(':id/questions')
  getRoleWithQuestions(
    @Param('id') id: number,
    @CurrentUser() adminUser: { userId: number },
  ) {
    return this.roleService.getRoleWithQuestions(+id, adminUser.userId);
  }

  @Post()
  async createRole(
    @Body()
    body: { name: string; description: string; experienceRequired: number },
    @CurrentUser()
    adminUser: { userId: number; organizationId: number },
  ) {
    return this.roleService.createRole(
      body.name,
      body.description,
      body.experienceRequired,
      adminUser.userId,
      adminUser.organizationId,
    );
  }

  @Put(':id')
  async updateRole(
    @Param('id') id: number,
    @Body()
    body: Partial<{
      name: string;
      description: string;
      experienceRequired: number;
    }>,
    @CurrentUser()
    adminUser: { userId: number },
  ) {
    return this.roleService.updateRole(id, adminUser.userId, body);
  }

  @Delete(':id')
  async deleteRole(
    @Param('id') id: number,
    @CurrentUser()
    adminUser: { userId: number },
  ) {
    return this.roleService.deleteRole(id, adminUser.userId);
  }

  @Get('seed-roles')
  async seedRoles() {
    return this.userRoleSeeder.seedRoles();
  }
}
