import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuperAdminService } from './super-admin.service';
import { CreateOrganizationDto } from '../organization/dto/create-organization.dto';
import { CreateAdminUserDto } from '../users/dto/create-user.dto';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard) // Global guard applied to controller
@Roles('superadmin') //  Require superadmin role by default
export class SuperAdminController {
  constructor(
    private readonly superAdminService: SuperAdminService,
  ) {}

  @Get('organizations')
  getAllOrganizations() {
    return this.superAdminService.getAllOrganizations();
  }

  @Post('create-org')
  createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.superAdminService.createOrganization(dto);
  }

  @Post('create-admin')
  createAdmin(@Body() dto: Partial<CreateAdminUserDto>) {
    return this.superAdminService.createAdminUnderOrg(dto);
  }

  @Get('admins')
  getAllAdmins(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.superAdminService.getAllAdmins(
      page !== undefined ? Number(page) : undefined,
      limit !== undefined ? Number(limit) : undefined,
    );
  }

  @Get('admin/:id')
  async getAdminById(@Param('id') id: string) {
    const user = await this.superAdminService.getAdminById(id);
    if (!user) throw new NotFoundException('Admin not found');
    return user;
  }

  @Put('admin/:id')
  updateAdmin(
    @Param('id') id: string,
    @Body() dto: Partial<CreateAdminUserDto>,
  ) {
    return this.superAdminService.updateAdmin(id, dto);
  }

  @Delete('admin/:id')
  deleteAdmin(@Param('id') id: string) {
    return this.superAdminService.deleteAdmin(id);
  }
}

//this conroller and the service points are working fine.
