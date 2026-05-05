import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { OrganizationModule } from '../organization/organization.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResetToken } from './entities/reset-token.entity';
import { Organization } from '../organization/entities/organization.entity';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    UsersModule,
    OrganizationModule,
    MailerModule,
    TypeOrmModule.forFeature([ResetToken, Organization]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET')?.trim();

        if (!secret) {
          throw new Error('JWT_SECRET is required');
        }

        return {
          secret,
          signOptions: { expiresIn: '1d' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule], // Export JwtModule so it's available in other modules
})
export class AuthModule {}
