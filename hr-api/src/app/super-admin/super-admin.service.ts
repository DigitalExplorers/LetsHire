import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from '../organization/entities/organization.entity';
import { AdminUser } from '../users/entities/users.entity';
import { Repository } from 'typeorm';
import { CreateOrganizationDto } from '../organization/dto/create-organization.dto';
import { CreateAdminUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { Role } from '../role/entities/role.entity';
import { UserRole } from '../user-role/entities/user.role.entity';
import { Interviewer } from '../interviewer/entities/interviewer.entity';
import { Interview } from '../interview/entities/interview.entity';
import { Candidate } from '../candidate/entities/candidate.entity';
import { RegistrationLink } from '../registration-link/entities/registration-link.entity';
import {
  buildPaginatedResponse,
  PaginatedResponse,
  resolvePagination,
} from '../../common/pagination/pagination.util';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,

    @InjectRepository(AdminUser)
    private readonly adminUserRepo: Repository<AdminUser>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly positionRepo: Repository<UserRole>,
    @InjectRepository(Interviewer)
    private readonly interviewerRepo: Repository<Interviewer>,
    @InjectRepository(Interview)
    private readonly interviewRepo: Repository<Interview>,
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
    @InjectRepository(RegistrationLink)
    private readonly registrationLinkRepo: Repository<RegistrationLink>,
  ) {}

  async getAllOrganizations() {
    return this.orgRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createOrganization(dto: CreateOrganizationDto) {
    const exists = await this.orgRepo.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Organization already exists');

    const newOrg = this.orgRepo.create(dto);
    return this.orgRepo.save(newOrg);
  }

  async createAdminUnderOrg(dto: Partial<CreateAdminUserDto>) {
    if (!dto.organizationId) {
      throw new NotFoundException('Organization is required');
    }
    if (!dto.email || !dto.name || !dto.password) {
      throw new NotFoundException('Name, email, and password are required');
    }

    const org = await this.orgRepo.findOne({ where: { id: dto.organizationId } });
    if (!org) throw new NotFoundException('Organization not found');

    const existing = await this.adminUserRepo.findOne({
      where: { email: dto.email.toLowerCase(), organization: { id: org.id } },
    });
    if (existing) throw new ConflictException('Email already exists in this organization');

    const role = await this.roleRepo.findOne({ where: { name: 'admin' } });
    if (!role) throw new NotFoundException('Admin role not found — ensure the role seeder has run');

    const admin = this.adminUserRepo.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: dto.password,
      role,
      organization: org,
    });

    return this.adminUserRepo.save(admin);
  }

  async getAllAdmins(
    page?: number,
    limit?: number,
  ): Promise<AdminUser[] | PaginatedResponse<AdminUser>> {
    const pagination = resolvePagination(page, limit);

    if (!pagination) {
      return this.adminUserRepo.find({
        relations: ['role', 'organization'],
        where: {
          role: { name: 'admin' },
        },
        order: { createdAt: 'DESC' },
      });
    }

    const [admins, total] = await this.adminUserRepo.findAndCount({
      relations: ['role', 'organization'],
      where: {
        role: { name: 'admin' },
      },
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return buildPaginatedResponse(admins, total, pagination.page, pagination.limit);
  }

  async getAdminById(id: string) {
    return this.adminUserRepo.findOne({
      where: { id },
      relations: ['role', 'organization'],
    });
  }

  async updateAdmin(id: string, dto: Partial<CreateAdminUserDto>) {
    const user = await this.getAdminById(id);
    if (!user) throw new NotFoundException('Admin not found');

    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email.toLowerCase();
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }
    if (dto.organizationId) {
      const org = await this.orgRepo.findOne({ where: { id: dto.organizationId } });
      if (!org) throw new NotFoundException('Organization not found');
      user.organization = org;
    }

    return this.adminUserRepo.save(user);
  }

  async deleteAdmin(id: string) {
    const admin = await this.getAdminById(id);
    if (!admin) throw new NotFoundException('Admin not found');

    const [
      positionCount,
      interviewerCount,
      interviewCount,
      candidateCount,
      registrationLinkCount,
    ] = await Promise.all([
      this.positionRepo.count({ where: { createdBy: { id } } }),
      this.interviewerRepo.count({ where: { createdBy: { id } } }),
      this.interviewRepo.count({ where: { createdBy: { id } } }),
      this.candidateRepo.count({ where: { adminUser: { id } } }),
      this.registrationLinkRepo.count({ where: { adminId: id } }),
    ]);

    const blockers = [
      [positionCount, 'positions'],
      [interviewerCount, 'interviewers'],
      [interviewCount, 'interviews'],
      [candidateCount, 'candidates'],
      [registrationLinkCount, 'registration links'],
    ]
      .filter(([count]) => Number(count) > 0)
      .map(([count, label]) => `${count} ${label}`);

    if (blockers.length > 0) {
      throw new ConflictException(
        `Admin "${admin.name}" cannot be deleted because it still has ${blockers.join(', ')}. Remove or reassign that data first.`,
      );
    }

    await this.adminUserRepo.delete(id);
    return { message: 'Admin deleted successfully', id };
  }
}
