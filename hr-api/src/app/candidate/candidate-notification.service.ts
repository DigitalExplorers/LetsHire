import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { MailService } from '../mailer/mailer.service';
import { Organization } from '../organization/entities/organization.entity';
import { RegistrationLinkService } from '../registration-link/registration-link.service';
import { Candidate } from './entities/candidate.entity';
import { Interview } from '../interview/entities/interview.entity';

dayjs.extend(utc);
dayjs.extend(timezone);

type Branding = {
  name: string;
  logoUrl?: string;
  address?: string;
  contactEmail?: string;
  primaryColor?: string;
};

@Injectable()
export class CandidateNotificationService {
  private readonly logger = new Logger(CandidateNotificationService.name);

  constructor(
    private readonly mailService: MailService,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    private readonly registrationLinkService: RegistrationLinkService,
    private readonly configService: ConfigService,
  ) {}

  private getDefaultBranding(): Branding {
    return {
      name: this.configService.get<string>('DEFAULT_ORG_NAME') || 'HR Platform',
      logoUrl: this.configService.get<string>('DEFAULT_LOGO_URL') || '',
      address: this.configService.get<string>('DEFAULT_ORG_ADDRESS') || '',
      contactEmail:
        this.configService.get<string>('DEFAULT_SUPPORT_EMAIL') ||
        this.configService.get<string>('DEFAULT_EMAIL_ADDRESS') ||
        '',
      primaryColor:
        this.configService.get<string>('DEFAULT_PRIMARY_COLOR') || '#be1d2c',
    };
  }

  private async getBrandingForOrganization(organizationId: number): Promise<Branding> {
    const foundOrg = await this.orgRepository.findOne({
      where: { id: organizationId },
    });

    const defaultBranding = this.getDefaultBranding();

    return foundOrg?.logoUrl && foundOrg?.address && foundOrg?.contactEmail
      ? {
          name: foundOrg.name,
          logoUrl: foundOrg.logoUrl,
          address: foundOrg.address,
          contactEmail: foundOrg.contactEmail,
          primaryColor: foundOrg.primaryColor ?? defaultBranding.primaryColor,
        }
      : defaultBranding;
  }

  private formatDateTime(dateInput: string | Date): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return (
      date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }) +
      ' at ' +
      date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    );
  }

  async sendUserConfirmation(
    email: string,
    otp: number,
    firstName: string,
    organizationId: number,
  ) {
    const branding = await this.getBrandingForOrganization(organizationId);
    await this.mailService.sendUserConfirmation(email, otp, firstName, branding);
  }

  async sendVideoSubmissionConfirmation(user: Candidate) {
    const branding = await this.getBrandingForOrganization(user.organization.id);

    await this.mailService.sendVideoSubmissionConfirmation(
      user.email.toLowerCase(),
      user.firstName,
      user.desiredRole,
      branding,
    );
  }

  async sendStatusUpdateNotification(
    user: Candidate,
    status: string,
    adminId: number,
  ) {
    const branding = await this.getBrandingForOrganization(user.organization.id);

    switch (status) {
      case 'Hired':
        await this.mailService.sendHiredMailConfirmation(
          user.email,
          status,
          user.firstName,
          branding,
        );
        return;
      case 'Rejected':
        await this.mailService.sendRejectedMailConfirmation(
          user.email,
          status,
          user.firstName,
          branding,
        );
        return;
      case 'Shortlisted': {
        const existingLinks = await this.registrationLinkService.getLinksByAdminAndRole(
          adminId,
          user.role.id,
          user.organization.id,
        );

        if (!existingLinks || existingLinks.length === 0) {
          throw new NotFoundException('No existing registration link found for this role');
        }

        const registrationUrl = existingLinks[0].registrationUrl;
        const istTimeZone = 'Asia/Kolkata';

        const examStartTime = dayjs
          .utc(existingLinks[0].examStartTime)
          .tz(istTimeZone)
          .format('DD/MM/YYYY hh:mm A');
        const examEndTime = dayjs
          .utc(existingLinks[0].examEndTime)
          .tz(istTimeZone)
          .format('DD/MM/YYYY hh:mm A');

        await this.mailService.sendShortListedMailConfirmation(
          user.email,
          status,
          user.firstName,
          branding,
          registrationUrl,
          examStartTime,
          examEndTime,
        );
        return;
      }
      default:
        return;
    }
  }

  async sendInterviewNotifications(interview: Interview) {
    if (!interview || !interview.scheduledDate) {
      throw new BadRequestException('Interview details are missing or invalid.');
    }

    const branding = await this.getBrandingForOrganization(
      interview.candidate.organization.id,
    );
    const formattedDate = this.formatDateTime(interview.scheduledDate);

    try {
      await this.mailService.sendInterviewNotificationToCandidate(
        interview.candidate.email,
        interview.candidate.firstName,
        interview.interviewer.name,
        interview.candidate.desiredRole,
        formattedDate,
        branding,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send interview notification to candidate ${interview.candidate.email}:`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    try {
      await this.mailService.sendInterviewNotificationToInterviewer(
        interview.interviewer.email,
        interview.interviewer.name,
        interview.candidate.firstName,
        interview.candidate.desiredRole,
        formattedDate,
        branding,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send interview notification to interviewer ${interview.interviewer.email}:`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
