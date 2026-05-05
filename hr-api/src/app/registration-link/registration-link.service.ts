import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { RegistrationLink } from './entities/registration-link.entity';
import { randomUUID } from 'crypto';
import { UserRole } from '../user-role/entities/user.role.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RegistrationLinkService {
  private readonly frontendUrl: string;

  constructor(
    @InjectRepository(RegistrationLink)
    private linkRepo: Repository<RegistrationLink>,
    @InjectRepository(UserRole)
    private roleRepo: Repository<UserRole>,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.getOrThrow<string>('FRONTEND_MOBILE_URL');
  }
  
  async generate(adminId: number, roleId: number, organizationId: number, examStartTime?: Date, examEndTime?: Date) {
    if (!examStartTime || !examEndTime) {
      throw new Error('examStartTime and examEndTime are required');
    }

    const token = randomUUID();
    const registrationUrl = `${this.frontendUrl}/${token}`;
    const qrCodeDataUrl = await QRCode.toDataURL(registrationUrl);
  
    const existing = await this.linkRepo.findOne({
      where: { adminId, roleId, organizationId },
    });
  
    const startTime = new Date(new Date(examStartTime).toISOString());
    const endTime = new Date(new Date(examEndTime).toISOString());

    if (existing) {
      const updated = await this.linkRepo.save({
        ...existing,
        token,
        examStartTime: startTime,
        examEndTime: endTime,
        createdAt: new Date(),
      });
  
      return {
        registrationUrl,
        qrCodeDataUrl,
        token: updated.token,
        examStartTime: updated.examStartTime,
        examEndTime: updated.examEndTime,
      };
    }

    const created = await this.linkRepo.save({
      token,
      adminId,
      roleId,
      organizationId,
      examStartTime: startTime,
      examEndTime: endTime,
    });

    return {
      registrationUrl,
      qrCodeDataUrl,
      token: created.token,
      examStartTime: created.examStartTime,
      examEndTime: created.examEndTime,
    };
  }

  async resolveToken(token: string) {
    const entry = await this.linkRepo.findOne({ where: { token } });
    if (!entry) throw new Error('Invalid or expired registration token');
    const role = await this.roleRepo.findOne({ where: { id: entry.roleId } });

    return {
      adminId: entry.adminId,
      roleId: entry.roleId,
      roleName: role?.name ?? null,
      organizationId: entry.organizationId,
      examStartTime: entry.examStartTime,
      examEndTime: entry.examEndTime,
    };
  }

  async getAllLinksForAdmin(adminId: number, organizationId: number) {
    const links = await this.linkRepo.find({ where: { adminId, organizationId } });
  
    // Append full URL and QR code for each
    const formatted = await Promise.all(
      links.map(async (link) => {
        const registrationUrl = `${this.frontendUrl}/${link.token}`;
        const qrCodeDataUrl = await QRCode.toDataURL(registrationUrl);
        return {
          id: link.id,
          roleId: link.roleId,
          token: link.token,
          registrationUrl,
          qrCodeDataUrl,
          createdAt: link.createdAt,
        };
      })
    );
  
    return formatted;
  }

  async getLinksByAdminAndRole(
    adminId: number,
    roleId: number,
    organizationId: number
  ) {
    const links = await this.linkRepo.find({
      where: {
        adminId,
        roleId,
        organizationId,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    // Append full URL and QR code for each
    const formatted = await Promise.all(
      links.map(async (link) => {
        const registrationUrl = `${this.frontendUrl}/${link.token}`;
        const qrCodeDataUrl = await QRCode.toDataURL(registrationUrl);
        return {
          id: link.id,
          roleId: link.roleId,
          token: link.token,
          registrationUrl,
          qrCodeDataUrl,
          createdAt: link.createdAt,
          examStartTime: link.examStartTime,
          examEndTime: link.examEndTime
        };
      })
    );

    return formatted;
  }


}
