import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { MailService } from './mailer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('mailer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin', 'hr', 'interviewer')
export class MailerController {
  constructor(private readonly mailerService: MailService) {}

  @Post('/send-otp')
  @HttpCode(200)
  async sendOtp(
    @Body() body: { email: string; otp: number; name: string; org: any },
  ): Promise<{ message: string }> {
    try {
      await this.mailerService.sendUserConfirmation(
        body.email,
        body.otp,
        body.name,
        body.org,
      );
      return { message: 'OTP sent successfully' };
    } catch (error) {
      console.error(`Failed to send OTP email to ${body.email}:`, error);
      return { message: 'Email service unavailable, but operation completed' };
    }
  }

  @Post('/mail-confirmation')
  @HttpCode(200)
  async sendMail(
    @Body() body: { email: string; result: string; name: string },
  ): Promise<{ message: string }> {
    try {
      await this.mailerService.sendMailConfirmation(
        body.email,
        body.result,
        body.name,
      );
      return { message: 'Confirmation email sent successfully' };
    } catch (error) {
      console.error(
        `Failed to send confirmation email to ${body.email}:`,
        error,
      );
      return { message: 'Email service unavailable, but operation completed' };
    }
  }
}
