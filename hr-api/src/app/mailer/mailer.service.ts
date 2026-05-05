import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendUserConfirmation(
    email: string,
    otp: number,
    name: string,
    organization: {
      name: string;
      logoUrl?: string;
      address?: string;
      contactEmail?: string;
    },
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Login OTP',
        template: 'otp',
        context: {
          email,
          name,
          otp,
          organization, // <-- pass organization info
        },
      });
    } catch (error) {
      console.error(`[MailService] Failed to send OTP to ${email}:`, error);
      throw error; // Re-throw to let caller handle it
    }
  }

  async sendMailConfirmation(email: string, result: string, name: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Mail Confirmation',
        template: 'mail-notify',
        context: {
          email,
          name,
          result,
        },
      });
    } catch (error) {
      console.error(
        `[MailService] Failed to send mail confirmation to ${email}:`,
        error,
      );
      throw error; // Re-throw to let caller handle it
    }
  }

  async sendHiredMailConfirmation(
    email: string,
    result: string,
    name: string,
    organization: {
      name: string;
      logoUrl?: string;
      address?: string;
      contactEmail?: string;
      primaryColor?: string;
    },
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Congratulations, ${name}! You're Hired at ${organization.name}`,

        template: 'hired-notify',
        context: {
          email,
          name,
          result,
          organization,
        },
      });
    } catch (error) {
      console.error(
        `[MailService] Failed to send hired notification to ${email}:`,
        error,
      );
      throw error; // Re-throw to let caller handle it
    }
  }

  async sendRejectedMailConfirmation(
    email: string,
    result: string,
    name: string,
    organization: {
      name: string;
      logoUrl?: string;
      address?: string;
      contactEmail?: string;
      primaryColor?: string;
    },
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Application Update – Thank You for Your Time',
        template: 'rejected-notify',
        context: {
          email,
          name,
          result,
          organization,
        },
      });
    } catch (error) {
      console.error(
        `[MailService] Failed to send rejection notification to ${email}:`,
        error,
      );
      throw error; // Re-throw to let caller handle it
    }
  }

  async sendShortListedMailConfirmation(
    email: string,
    result: string,
    name: string,
    organization: {
      name: string;
      logoUrl?: string;
      address?: string;
      contactEmail?: string;
      primaryColor?: string;
    },
    registrationUrl: string,
    examStartTime: string,
    examEndTime: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Next Interview Round Scheduled – ${organization.name}`,
        template: 'shortlist-notify',
        context: {
          email,
          name,
          result,
          organization,
          registrationUrl,
          examStartTime,
          examEndTime,
        },
      });
    } catch (error) {
      console.error(
        `[MailService] Failed to send shortlist notification to ${email}:`,
        error,
      );
      throw error; // Re-throw to let caller handle it
    }
  }

  async sendInterviewNotificationToInterviewer(
    email: string,
    interviewerName: string,
    candidateName: string,
    role: string,
    interviewDate: any,
    organization: {
      name: string;
      logoUrl?: string;
      address?: string;
      contactEmail?: string;
      primaryColor?: string;
    },
    // interviewTime: string,
    // interviewMode: string,
    // meetingLink: string
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Upcoming Interview: Candidate ${candidateName} for ${role} - ${organization.name}`,
        template: 'interviewer-notify',
        context: {
          interviewerName,
          candidateName,
          role,
          interviewDate,
          organization,
          // interviewTime,
          // interviewMode,
          // meetingLink,
        },
      });
    } catch (error) {
      console.error(
        `[MailService] Failed to send interview notification to interviewer ${email}:`,
        error,
      );
      throw error; // Re-throw to let caller handle it
    }
  }

  async sendInterviewNotificationToCandidate(
    email: string,
    name: string,
    interviewerName: string,
    role: string,
    interviewDate: any,
    organization: {
      name: string;
      logoUrl?: string;
      address?: string;
      contactEmail?: string;
      primaryColor?: string;
    },
    // interviewTime: string,
    // interviewMode: string,
    // meetingLink: string
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Interview Scheduled with ${interviewerName} - Letshire`,
        template: 'candidate-notify',
        context: {
          name,
          interviewerName,
          role,
          interviewDate,
          organization,
          // interviewTime,
          // interviewMode,
          // meetingLink,
        },
      });
    } catch (error) {
      console.error(
        `[MailService] Failed to send interview notification to candidate ${email}:`,
        error,
      );
      throw error; // Re-throw to let caller handle it
    }
  }

  async sendVideoSubmissionConfirmation(
    email: string,
    name: string,
    role: string,
    organization: {
      name: string;
      logoUrl?: string;
      address?: string;
      contactEmail?: string;
    },
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Registration Successful!`,
        template: 'register-success',
        context: {
          name,
          email,
          role,
          organization,
        },
      });
    } catch (error) {
      console.error(
        `[MailService] Failed to send video submission confirmation to ${email}:`,
        error,
      );
      throw error; // Re-throw to let caller handle it
    }
  }

  async sendForgotPasswordEmail(
    email: string,
    name: string,
    resetLink: string,
    organization: {
      name: string;
      logoUrl?: string;
      address?: string;
      contactEmail?: string;
      primaryColor?: string;
    },
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Your Password',
        template: 'reset-password', // points to reset-password.hbs
        context: {
          name,
          email,
          resetLink,
          organization,
        },
      });
    } catch (error) {
      console.error(
        `[MailService] Failed to send password reset email to ${email}:`,
        error,
      );
      throw error; // Re-throw to let caller handle it
    }
  }
}
