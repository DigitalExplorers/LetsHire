import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AdminUser } from '../users/entities/users.entity';
import { Role } from '../role/entities/role.entity';

@Injectable()
export class SuperAdminSeeder {
  private readonly logger = new Logger(SuperAdminSeeder.name);

  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepo: Repository<AdminUser>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    private readonly configService: ConfigService,
  ) {}

  async seed(): Promise<{ message: string }> {
    const email =
      this.configService.get<string>('SUPER_ADMIN_EMAIL') || 'superadmin@example.com';

    // ── Guard: already seeded ─────────────────────────────────────────────
    const existing = await this.adminUserRepo.findOne({ where: { email } });
    if (existing) {
      this.logger.log(`ℹ️  Super Admin '${email}' already exists — skipping`);
      return { message: 'Super Admin already seeded' };
    }

    // ── Guard: password must be configured ────────────────────────────────
    const rawPassword = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
    if (!rawPassword) {
      this.logger.warn(
        'SUPER_ADMIN_PASSWORD is not set in environment. Skipping super-admin seed. ' +
          'Set SUPER_ADMIN_PASSWORD in your .env file.',
      );
      return { message: 'Skipped: SUPER_ADMIN_PASSWORD not configured' };
    }

    // ── Guard: superadmin role must exist (created by RoleSeeder first) ───
    const superAdminRole = await this.roleRepo.findOne({ where: { name: 'superadmin' } });
    if (!superAdminRole) {
      this.logger.warn(
        "'superadmin' role not found in the database. " +
          'Ensure RoleSeeder runs before SuperAdminSeeder (see main.ts bootstrap order).',
      );
      return { message: 'Skipped: superadmin role not found' };
    }

    // ── Create super admin ─────────────────────────────────────────────────
    // The AdminUser entity's @BeforeInsert() will hash rawPassword with bcrypt.
    const superAdmin = this.adminUserRepo.create({
      name: 'Super Admin',
      email,
      password: rawPassword,
      isSuperAdmin: true,
      role: superAdminRole,
    });

    await this.adminUserRepo.save(superAdmin);

    this.logger.log(`✅ Super Admin '${email}' created successfully`);
    return { message: `Super Admin seeded successfully (email: ${email})` };
  }
}
