import { Controller, Post, Body, Get, Query, Param, UseGuards, Req, NotFoundException, Put, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateSubUserDto } from './dto/create-sub-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';


interface AuthenticatedRequest extends Request {
  user?: { userId: number; email: string };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  async createUser(@Body() body: { name: string; email: string; password: string, organization: any }) {
    return this.usersService.createUser(body.name, body.email, body.password, body.organization);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserByEmail(@Query('email') email: string) {
    if (!email) {
      throw new NotFoundException('Email parameter is required');
    }

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
    }

  @Get('check-email')
  async checkEmail(
    @Query('email') email: string,
    @Query('organizationName') organizationName: string
  ) {
    const userExist = await this.usersService.findByEmailOrg(email, organizationName);
    return { exists: userExist };
  }


  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;

    if (!userId || isNaN(Number(userId))) {
      throw new NotFoundException('Invalid or missing User ID');
    }

    const user = await this.usersService.getUserById(Number(userId));

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // return user;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('sub-user')
  async createSubUser(@Body() dto: CreateSubUserDto, @CurrentUser() adminUser: {organizationId: number }) {
    console.log("createSubUser ");
    return this.usersService.createSubUser(dto, adminUser.organizationId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('sub-users')
  async getSubUsers(
    @CurrentUser() adminUser: { organizationId: number },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getSubUsersByOrganization(
      adminUser.organizationId,
      page !== undefined ? Number(page) : undefined,
      limit !== undefined ? Number(limit) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('sub-user/:id')
  async getSubUser(@Param('id') id: number,) {
    return this.usersService.getSubUser(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('sub-user/:id')
  async updateSubUser(
    @Param('id') id: number,
    @Body() dto: Partial<CreateSubUserDto>, // Partial so all fields aren't required
  ) {
    return this.usersService.updateSubUser(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('sub-user/:id')
  async deleteSubUser(@Param('id') id: number) {
    return this.usersService.deleteSubUser(id);
  }
  
}
