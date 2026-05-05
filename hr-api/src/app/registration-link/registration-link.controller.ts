import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { RegistrationLinkService } from './registration-link.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('registration-link')
export class RegistrationLinkController {
  constructor(private readonly linkService: RegistrationLinkService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async generateLink(
    @Query('roleId') roleId: number,
    @Query('examStartTime') examStartTime: string,
    @Query('examEndTime') examEndTime: string,
    @CurrentUser() user: { userId: number, organizationId: number },
  ) {
    const startTime = new Date(examStartTime);
    const endTime = new Date(examEndTime);

    return this.linkService.generate(user.userId, roleId, user.organizationId, startTime, endTime);
  }

  @Get('resolve/:token')
  async resolve(@Param('token') token: string) {
    return this.linkService.resolveToken(token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getAllGeneratedURLs')
  async getAllLinks(@CurrentUser() user: { userId: number, organizationId: number }) {
    return this.linkService.getAllLinksForAdmin(user.userId, user.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('by-role')
  async getLinksByRoleAndAdmin(
    @Query('roleId') roleId: number,
    @CurrentUser() user: { userId: number, organizationId: number }
  ) {
    return this.linkService.getLinksByAdminAndRole(user.userId, roleId, user.organizationId);
  }
}
