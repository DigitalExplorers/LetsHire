import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RoleSeeder {
  private readonly logger = new Logger(RoleSeeder.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  private readonly roles: Array<{ name: string; displayName: string }> = [
    { name: 'superadmin', displayName: 'Super Admin' },
    { name: 'admin', displayName: 'Admin' },
    { name: 'hr', displayName: 'Human Resources' },
    { name: 'interviewer', displayName: 'Interviewer' },
  ];

  async seed(): Promise<{ message: string; created: string[]; skipped: string[] }> {
    const created: string[] = [];
    const skipped: string[] = [];

    for (const roleData of this.roles) {
      const exists = await this.roleRepo.findOne({ where: { name: roleData.name } });

      if (exists) {
        this.logger.log(`ℹ️  Role '${roleData.name}' already exists — skipping`);
        skipped.push(roleData.name);
      } else {
        await this.roleRepo.save(this.roleRepo.create(roleData));
        this.logger.log(`✅ Role '${roleData.name}' created`);
        created.push(roleData.name);
      }
    }

    const summary = `Role seeding done — created: [${created.join(', ') || 'none'}], skipped: [${skipped.join(', ') || 'none'}]`;
    this.logger.log(summary);

    return { message: summary, created, skipped };
  }
}
