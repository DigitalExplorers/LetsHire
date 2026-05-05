import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { RoleService } from './role.service';
import { Role } from './entities/role.entity';
import { RoleSeeder } from './role.seeder';

@Controller('admin-roles')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly roleSeeder: RoleSeeder
) {}

  @Get()
  findAll(): Promise<Role[]> {
    return this.roleService.findAll();
  }


  @Get('seed')
  async seedRoles() {
    return this.roleSeeder.seed();
  }

  @Get(':id')
  findById(@Param('id') id: number) {
    return this.roleService.findById(id);
  }

  @Post()
  create(@Body() body: Partial<Role>) {
    return this.roleService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() body: Partial<Role>) {
    return this.roleService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.roleService.delete(id);
  }

}
