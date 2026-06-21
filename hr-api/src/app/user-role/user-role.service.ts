import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../user-role/entities/user.role.entity';
import { AdminUser } from '../users/entities/users.entity';
import { BedrockService } from '../bedrock/bedrock.service';
import { Quiz } from '../quiz/entities/quiz.entity';
import { Option } from '../quiz/entities/option.entity';
import { QuizService } from '../quiz/quiz.service';
import { Candidate } from '../candidate/entities/candidate.entity';
import { CandidateTestAttempt } from '../quiz/entities/candidate-test-attempt.entity';
import { RegistrationLink } from '../registration-link/entities/registration-link.entity';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole)
    private roleRepository: Repository<UserRole>,
    @InjectRepository(AdminUser)
    private adminRepo: Repository<AdminUser>,

    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,

    @InjectRepository(Option)
    private optionRepository: Repository<Option>,
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    @InjectRepository(CandidateTestAttempt)
    private attemptRepository: Repository<CandidateTestAttempt>,
    @InjectRepository(RegistrationLink)
    private registrationLinkRepository: Repository<RegistrationLink>,

    private readonly quizService: QuizService,

    private readonly bedrockService: BedrockService,

  ) { }

  async getAllRoles(adminId: string): Promise<UserRole[]> {
    return this.roleRepository.find({
      where: { createdBy: { id: adminId } },
    });
  }

  // async getRoleWithQuestions(roleId: number, adminId: number): Promise<UserRole> {
  //   const res = await this.roleRepository.findOne({
  //     where: { id: roleId, createdBy: { id: adminId } },
  //     relations: ['quizzes', 'quizzes.options'],
  //   });

  //   if (!res) throw new NotFoundException('Role not found or access denied');
  //   return res;
  // }

  async getRoleWithQuestions(roleId: string, adminId: string): Promise<UserRole> {
    const role = await this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.quizzes', 'quiz', 'quiz.status = :status', { status: 'active' })
      .leftJoinAndSelect('quiz.options', 'option')
      .where('role.id = :roleId', { roleId })
      .andWhere('role.createdBy.id = :adminId', { adminId })
      .getOne();

    if (!role) throw new NotFoundException('Role not found or access denied');
    return role;
  }

  async createRole(
    name: string,
    description: string,
    experienceRequired: number,
    adminId: string,
    organizationId: string,
  ): Promise<UserRole> {
    const existingRole = await this.roleRepository.findOne({
      where: { name, createdBy: { id: adminId } },
    });

    if (existingRole) return existingRole;

    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) throw new NotFoundException('Admin user not found');

    const newRole = this.roleRepository.create({
      name,
      description,
      experienceRequired,
      createdBy: admin,
      organization: { id: organizationId },
    });

    const savedRole = await this.roleRepository.save(newRole);

    await this.quizService.updateQuizConfigByRole(savedRole.id, 20, 45, adminId, organizationId);

    // Run question generation async in background
    // void (async () => {
    //   try {
    //     const generated = await this.bedrockService.generateQuestions(
    //       savedRole,
    //       50,
    //       adminId,
    //       organizationId
    //     );
    //   } catch (err) {
    //     console.error(`Question generation failed for role ${savedRole.name}:`, err.message);
    //   }
    // })();
    return savedRole;
  }

  async updateRole(
    id: string,
    adminId: string,
    updateData: Partial<{ name: string; description: string; experienceRequired: number }>,
  ): Promise<UserRole> {
    const role = await this.roleRepository.findOne({
      where: { id, createdBy: { id: adminId } },
    });

    if (!role) throw new NotFoundException('Role not found');

    Object.assign(role, updateData);
    return this.roleRepository.save(role);
  }

  // async deleteRole(id: number, adminId: number): Promise<{ message: string }> {
  //   const role = await this.roleRepository.findOne({
  //     where: { id, createdBy: { id: adminId } },
  //   });

  //   if (!role) throw new NotFoundException('Role not found or access denied');

  //   await this.roleRepository.remove(role);
  //   return { message: 'Role deleted successfully' };
  // }

  async deleteRole(id: string, adminId: string): Promise<{ message: string }> {
    const role = await this.roleRepository.findOne({
      where: { id, createdBy: { id: adminId } },
      relations: ['quizzes'],
    });

    if (!role) {
      throw new NotFoundException('Role not found or access denied');
    }

    const [candidateCount, registrationLinkCount, attemptCount] =
      await Promise.all([
        this.candidateRepository.count({ where: { role: { id } } }),
        this.registrationLinkRepository.count({ where: { roleId: id } }),
        this.attemptRepository
          .createQueryBuilder('attempt')
          .innerJoin('attempt.quiz', 'quiz')
          .where('quiz.roleId = :roleId', { roleId: id })
          .getCount(),
      ]);

    const blockers = [
      [candidateCount, 'candidates'],
      [registrationLinkCount, 'registration links'],
      [attemptCount, 'quiz attempts'],
    ]
      .filter(([count]) => Number(count) > 0)
      .map(([count, label]) => `${count} ${label}`);

    if (blockers.length > 0) {
      throw new ConflictException(
        `Position "${role.name}" cannot be deleted because it still has ${blockers.join(', ')}. Remove or reassign that data first.`,
      );
    }

    // Find all quizzes for this role
    const quizzes = await this.quizRepository.find({
      where: { role: { id } },
    });

    // Mark each quiz as inactive
    for (const quiz of quizzes) {
      quiz.status = 'inactive';
      await this.quizRepository.save(quiz);
    }

    // Now remove the role
    await this.roleRepository.remove(role);
    return { message: 'Role deleted and all related quizzes marked as inactive' };
  }

  async getRoleById(id: string, adminId: string) {
    const role = await this.roleRepository.findOne({
      where: {
        id,
        createdBy: { id: adminId },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

}
