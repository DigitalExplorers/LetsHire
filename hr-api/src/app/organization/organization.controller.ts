import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Put,
  Delete,
  NotFoundException,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../services/s3.service';
import { Organization } from './entities/organization.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly orgService: OrganizationService,
    private readonly s3Service: S3Service,
  ) { }

  private async withSignedUrls(org: Organization) {
    const [logoUrl, bgImageUrl] = await Promise.all([
      org.logoUrl ? this.s3Service.getPreSignedUrl(org.logoUrl) : null,
      org.bgImageUrl ? this.s3Service.getPreSignedUrl(org.bgImageUrl) : null,
    ]);
    return { ...org, logoUrl, bgImageUrl };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  async create(@Body() dto: CreateOrganizationDto) {
    return this.orgService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const orgs = await this.orgService.findAll(
      page !== undefined ? Number(page) : undefined,
      limit !== undefined ? Number(limit) : undefined,
    );

    if (Array.isArray(orgs)) {
      return Promise.all(orgs.map((org) => this.withSignedUrls(org)));
    }

    return {
      data: await Promise.all(orgs.data.map((org) => this.withSignedUrls(org))),
      meta: orgs.meta,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: { role?: string; organizationId?: string | null },
  ) {
    if (
      currentUser.role !== 'superadmin' &&
      currentUser.organizationId !== id
    ) {
      throw new ForbiddenException(
        'You are not allowed to access this organization',
      );
    }

    const org = await this.orgService.findById(id);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return this.withSignedUrls(org);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  async delete(@Param('id') id: string) {
    const deleted = await this.orgService.delete(id);
    if (!deleted) {
      throw new NotFoundException('Organization not found or already deleted');
    }
    return { message: 'Organization deleted successfully' };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  async update(
    @Param('id') id: string,
    @Body() dto: CreateOrganizationDto
  ) {
    return this.orgService.update(id, dto);
  }

  @Post(':id/upload-logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const org = await this.orgService.findById(id);
    if (!org) throw new NotFoundException('Organization not found');

    const { fileKey } = await this.s3Service.uploadPublicAsset(file, org.name, 'logos');
    await this.orgService.update(id, { ...org, logoUrl: fileKey });
    const logoUrl = await this.s3Service.getPreSignedUrl(fileKey);
    return { message: 'Logo uploaded successfully', logoUrl };
  }

  @Post(':id/upload-bg')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBackground(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const org = await this.orgService.findById(id);
    if (!org) throw new NotFoundException('Organization not found');

    const { fileKey } = await this.s3Service.uploadPublicAsset(file, org.name, 'backgrounds');
    await this.orgService.update(id, { ...org, bgImageUrl: fileKey });
    const bgImageUrl = await this.s3Service.getPreSignedUrl(fileKey);
    return { message: 'Background uploaded successfully', bgImageUrl };
  }
}
