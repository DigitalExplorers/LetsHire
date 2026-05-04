import { Module } from '@nestjs/common';
import { MailService } from './mailer.service';
import { MailerController } from './mailer.controller';
import { CustomHandlebarsAdapter } from '../../custom-handlebars.adapter';
import { MailerModule as MailModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          transport: {
            host: config.get<string>('MAIL_HOST') || 'smtp.sendgrid.net',
            port: +(config.get<string>('MAIL_PORT') || 465),
            secure: true,
            auth: {
              user: config.get<string>('MAIL_USER'),
              pass: config.get<string>('MAIL_PASS'),
            },
          },
          defaults: {
            from: config.get<string>('DEFAULT_EMAIL_ADDRESS'),
          },
          template: {
            dir: join(process.cwd(), 'src', 'templates'),
            adapter: new CustomHandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  controllers: [MailerController],
  exports: [MailService],
})
export class MailerModule {}
