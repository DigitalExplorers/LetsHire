import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AdminUser } from '../users/entities/users.entity';
import { Candidate } from '../candidate/entities/candidate.entity';
import { UserRole } from '../user-role/entities/user.role.entity';
import { Quiz } from '../quiz/entities/quiz.entity';
import { QuizConfig } from '../quiz/entities/quiz-config.entity';
import { Interviewer } from '../interviewer/entities/interviewer.entity';
import { Interview } from '../interview/entities/interview.entity';
import { RegistrationLink } from '../registration-link/entities/registration-link.entity';
import {
  buildPaginatedResponse,
  PaginatedResponse,
  resolvePagination,
} from '../../common/pagination/pagination.util';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
    @InjectRepository(UserRole)
    private readonly roleRepo: Repository<UserRole>,
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(QuizConfig)
    private readonly quizConfigRepo: Repository<QuizConfig>,
    @InjectRepository(Interviewer)
    private readonly interviewerRepo: Repository<Interviewer>,
    @InjectRepository(Interview)
    private readonly interviewRepo: Repository<Interview>,
    @InjectRepository(RegistrationLink)
    private readonly registrationLinkRepo: Repository<RegistrationLink>,
  ) {}

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    const existing = await this.orgRepo.findOne({ where: { name: dto.name } });
    if (existing) return existing;
  
    const newOrg = this.orgRepo.create(dto);
    return await this.orgRepo.save(newOrg);
  }
  

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<Organization[] | PaginatedResponse<Organization>> {
    const pagination = resolvePagination(page, limit);

    if (!pagination) {
      return this.orgRepo.find({ order: { createdAt: 'DESC' } });
    }

    const [organizations, total] = await this.orgRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return buildPaginatedResponse(organizations, total, pagination.page, pagination.limit);
  }

  async findById(id: string): Promise<Organization | null> {
    return this.orgRepo.findOne({ where: { id } });
  }

  async delete(id: string): Promise<boolean> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) {
      return false;
    }

    const [
      adminCount,
      candidateCount,
      roleCount,
      quizCount,
      quizConfigCount,
      interviewerCount,
      interviewCount,
      registrationLinkCount,
    ] = await Promise.all([
      this.adminRepo.count({ where: { organization: { id } } }),
      this.candidateRepo.count({ where: { organization: { id } } }),
      this.roleRepo.count({ where: { organization: { id } } }),
      this.quizRepo.count({ where: { organization: { id } } }),
      this.quizConfigRepo.count({ where: { organization: { id } } }),
      this.interviewerRepo.count({ where: { organization: { id } } }),
      this.interviewRepo.count({ where: { organization: { id } } }),
      this.registrationLinkRepo.count({ where: { organizationId: id } }),
    ]);

    const blockers = [
      [adminCount, 'admins'],
      [candidateCount, 'candidates'],
      [roleCount, 'positions'],
      [quizCount, 'quizzes'],
      [quizConfigCount, 'quiz configs'],
      [interviewerCount, 'interviewers'],
      [interviewCount, 'interviews'],
      [registrationLinkCount, 'registration links'],
    ]
      .filter(([count]) => Number(count) > 0)
      .map(([count, label]) => `${count} ${label}`);

    if (blockers.length > 0) {
      throw new ConflictException(
        `Organization "${org.name}" cannot be deleted because it still has ${blockers.join(', ')}. Remove or reassign that data first.`,
      );
    }

    const result = await this.orgRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
  

  async update(id: string, dto: CreateOrganizationDto): Promise<Organization> {
    const org = await this.orgRepo.findOneBy({ id });
    if (!org) throw new NotFoundException('Organization not found');
  
    const updated = this.orgRepo.merge(org, dto);
    return this.orgRepo.save(updated);
  }
  

}
