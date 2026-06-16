import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AdminUser } from '../users/entities/users.entity';
import { Organization } from '../organization/entities/organization.entity';
import { CreateSubUserDto } from './dto/create-sub-user.dto';
import { Role } from '../role/entities/role.entity';
import { Interviewer } from '../interviewer/entities/interviewer.entity';
import {
  buildPaginatedResponse,
  PaginatedResponse,
  resolvePagination,
} from '../../common/pagination/pagination.util';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(AdminUser) private userRepo: Repository<AdminUser>,
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Interviewer)
    private readonly interviewerRepo: Repository<Interviewer>,
  ) { }

  async createUser(name: string, email: string, password: string, organization: any) {
    
    const existing = await this.userRepo.findOne({
      where: {
        email: email.toLowerCase(),
        organization: { id: organization.id },
      },
    });
  
    if (existing) {
      throw new BadRequestException('Email already exists in this organization');
    }
  
    const role = await this.roleRepo.findOne({ where: { name: 'admin' } });
    if (!role) throw new Error('Role not found');

    const newUser = this.userRepo.create({
      name,
      email,
      password,
      organization,
      role
    });
  
    return await this.userRepo.save(newUser);
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    console.log('Looking for user with email:', email);
    return await this.userRepo.findOne({ where: { email } });
  }


  async findByEmailOrg(email: string, organizationName: string): Promise<boolean> {
    
    const normalizedOrgName = organizationName.trim().toLowerCase();
  
    // 1. Try to find existing organization
    const organization = await this.organizationRepo
      .createQueryBuilder("organization")
      .where("LOWER(organization.name) = :name", { name: normalizedOrgName })
      .getOne();

    if (!organization) {
      return false;
    }
  
    const user = await this.userRepo.findOne({
      where: {
        email: email.toLowerCase(),
        organization: { id: organization.id },
      },
      relations: ['organization'],
    });

    return !!user;
  }

  async getUserById(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async createSubUser(dto: CreateSubUserDto, organizationId: string) {
    const role = await this.roleRepo.findOne({ where: { name: dto.role } });
    if (!role) throw new Error('Role not found');

    const subUser = this.userRepo.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: dto.password,
      role: role,
      organization: { id: organizationId },
    });

    await this.userRepo.save(subUser);

    // If the new user has the 'interviewer' role, mirror them into the interviewer table
    if (dto.role === 'interviewer') {
      const existing = await this.interviewerRepo.findOne({ where: { id: subUser.id } });
      if (!existing) {
        const interviewerRecord = this.interviewerRepo.create({
          id: subUser.id,           // keep IDs in sync
          name: subUser.name,
          email: subUser.email,
          skills: [],
          department: 'N/A',
          availability: 'Available',
          createdBy: subUser,
          organization: { id: organizationId },
        });
        await this.interviewerRepo.save(interviewerRecord);
      }
    }

    return { id: subUser.id, message: 'User created successfully' };
  }

  async getSubUsersByOrganization(
    organizationId: string,
    page?: number,
    limit?: number,
  ): Promise<AdminUser[] | PaginatedResponse<AdminUser>> {
    const pagination = resolvePagination(page, limit);

    if (!pagination) {
      return this.userRepo.find({
        where: {
          organization: { id: organizationId },
          role: { name: In(['hr', 'interviewer']) },
        },
        relations: ['role'],
        order: { createdAt: 'DESC' },
      });
    }

    const [users, total] = await this.userRepo.findAndCount({
      where: {
        organization: { id: organizationId },
        role: { name: In(['hr', 'interviewer']) },
      },
      relations: ['role'],
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return buildPaginatedResponse(users, total, pagination.page, pagination.limit);
  }

  async getSubUser(userId: string) {
    return this.userRepo.findOne({ where: { id: userId } });
  }


  async updateSubUser(id: string, dto: Partial<CreateSubUserDto>) {
    const user = await this.getUserById(id);

    if (!user) throw new Error('User not found');
  
    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email.toLowerCase();
    if (dto.password) user.password = dto.password;
    if (dto.role) {
      const role = await this.roleRepo.findOne({ where: { name: dto.role } });
      if (!role) throw new Error('Role not found');
      user.role = role;
    }
  
    await this.userRepo.save(user);

    // Keep interviewer mirror in sync
    const existingInterviewer = await this.interviewerRepo.findOne({ where: { id } });
    if (dto.role === 'interviewer') {
      if (existingInterviewer) {
        // Update name/email in mirror
        if (dto.name) existingInterviewer.name = dto.name;
        if (dto.email) existingInterviewer.email = dto.email.toLowerCase();
        await this.interviewerRepo.save(existingInterviewer);
      } else {
        // Create mirror if it doesn't exist yet
        const interviewerRecord = this.interviewerRepo.create({
          id,
          name: user.name,
          email: user.email,
          skills: [],
          department: 'N/A',
          availability: 'Available',
          createdBy: user,
          organization: user.organization,
        });
        await this.interviewerRepo.save(interviewerRecord);
      }
    } else if (existingInterviewer) {
      // Role changed away from 'interviewer' — remove the mirror
      await this.interviewerRepo.delete(id);
    }

    return { id: user.id, message: 'User updated successfully' };
  }
  
  async deleteSubUser(id: string) {
    const result = await this.userRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('User not found');
    return { message: 'User deleted successfully' };
  }

  async updateUserPassword(userId: string, newPassword: string) {
    const user = await this.getUserById(userId);
    if (!user) throw new NotFoundException('User not found');
  
    user.password = newPassword;
    return this.userRepo.save(user);
  }


}
