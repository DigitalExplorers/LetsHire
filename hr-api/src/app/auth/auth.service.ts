import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from '../organization/entities/organization.entity';
import { Repository } from 'typeorm';
import { ResetToken } from './entities/reset-token.entity';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from '../mailer/mailer.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly frontendUrl: string;
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
    @InjectRepository(ResetToken)
    private readonly resetTokenRepo: Repository<ResetToken>,
  ) {
    this.frontendUrl =
      this.configService.getOrThrow<string>('FRONTEND_DASHBOARD');
  }

  private getDefaultBranding() {
    return {
      name: this.configService.get<string>('DEFAULT_ORG_NAME') || 'Letshire',
      logoUrl:
        this.configService.get<string>('DEFAULT_LOGO_URL') ||
        'https://images.squarespace-cdn.com/content/v1/675b56bf73db55527a60b807/a0cf9325-a99c-4534-aec5-86ad2a67c611/8800+Logo+2.png?format=500w',
      address:
        this.configService.get<string>('DEFAULT_ORG_ADDRESS') ||
        '8517 Pine Valley Dr, McKinney, TX, 75070',
      contactEmail:
        this.configService.get<string>('DEFAULT_SUPPORT_EMAIL') ||
        'support@the8800.com',
      primaryColor:
        this.configService.get<string>('DEFAULT_PRIMARY_COLOR') || '#be1d2c',
    };
  }

  async signUp(signupDto: SignupDto) {
    const { name, email, password, organizationName } = signupDto;

    const normalizedOrgName = organizationName.trim().toLowerCase();

    // 1. Try to find existing organization
    let organization = await this.organizationRepo
      .createQueryBuilder('organization')
      .where('LOWER(organization.name) = :name', { name: normalizedOrgName })
      .getOne();

    // 2. If not found, create it
    if (!organization) {
      organization = this.organizationRepo.create({
        name: organizationName.trim(),
      });
      organization = await this.organizationRepo.save(organization);
    }

    // 3. Proceed if found
    return await this.usersService.createUser(
      name,
      email.toLowerCase(),
      password,
      organization,
    );
  }

  async validateUser(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role?.name,
      organizationId: user.organization?.id ?? null,
    };
    return {
      access_token: this.jwtService.sign(payload),
      id: user.id,
      role: user.role?.name,
      organizationId: user.organization?.id ?? null,
    };
  }

  async sendResetPasswordEmail(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // Don't reveal if user exists

    const foundOrg = await this.organizationRepo.findOne({
      where: { id: user.organization.id },
    });

    const defaultBranding = this.getDefaultBranding();

    // Use default branding if ANY key field is missing
    const finalBranding =
      foundOrg?.logoUrl && foundOrg?.address && foundOrg?.contactEmail
        ? {
            name: foundOrg.name,
            logoUrl: foundOrg.logoUrl,
            address: foundOrg.address,
            contactEmail: foundOrg.contactEmail,
            primaryColor: foundOrg.primaryColor ?? '#be1d2c',
          }
        : defaultBranding;

    const token = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.resetTokenRepo.save({ userId: user.id, token, expires });

    const resetLink = `${this.frontendUrl}/auth/reset-password?token=${token}`;

    // Send password reset email (non-blocking)
    try {
      await this.mailService.sendForgotPasswordEmail(
        user.email,
        user.name,
        resetLink,
        finalBranding,
      );
    } catch (error) {
      console.error(
        `Failed to send password reset email to ${user.email}:`,
        error,
      );
      // Email failure should not block password reset token generation
      // User can still use the reset link if they have it through other means
    }
  }

  async resetPassword(token: string, newPassword: string) {
    console.log('resetPassword ');
    const reset = await this.resetTokenRepo.findOne({ where: { token } });
    if (!reset || reset.expires < new Date()) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.usersService.getUserById(reset.userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }   // i feel we are doing validation twice once here and ince in the updateUserPassword 

    await this.usersService.updateUserPassword(reset.userId, newPassword);
    await this.resetTokenRepo.delete({ userId: user.id });
    //previously this only deleted single token ({token}) but multiple tokens were as is hence({userId: user.id}) fixed the concern.
  }
}
