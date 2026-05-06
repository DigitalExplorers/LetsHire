import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, LessThan, Repository } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { Interviewer } from '../interviewer/entities/interviewer.entity';
import { Interview } from '../interview/entities/interview.entity';
import { UserRole } from '../user-role/entities/user.role.entity';
import { Cron } from '@nestjs/schedule';
import { CandidateTestAttempt } from '../quiz/entities/candidate-test-attempt.entity';
import {
  buildPaginatedResponse,
  PaginatedResponse,
  resolvePagination,
} from '../../common/pagination/pagination.util';
import { CandidateNotificationService } from './candidate-notification.service';
import { CandidateDocumentService } from './candidate-document.service';

export interface IUserSafe {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

type StaffActor = {
  role?: string;
  organizationId?: number | null;
};

@Injectable()
export class CandidateService {
  private readonly logger = new Logger(CandidateService.name);

  constructor(
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    private readonly candidateNotificationService: CandidateNotificationService,
    private readonly candidateDocumentService: CandidateDocumentService,
    @InjectRepository(Interviewer)
    private readonly interviewerRepo: Repository<Interviewer>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(CandidateTestAttempt)
    private attemptRepo: Repository<CandidateTestAttempt>,
  ) {}

  private isSuperAdmin(actor: StaffActor) {
    return actor.role === 'superadmin';
  }

  private ensureOrganizationScope(actor: StaffActor) {
    if (this.isSuperAdmin(actor)) {
      return;
    }

    if (!actor.organizationId) {
      throw new NotFoundException('Organization context is required');
    }
  }

  private async getAccessibleCandidate(
    candidateId: number,
    actor: StaffActor,
    relations: string[] = [],
  ) {
    this.ensureOrganizationScope(actor);

    const where: FindOptionsWhere<Candidate> = this.isSuperAdmin(actor)
      ? { id: candidateId }
      : { id: candidateId, organization: { id: actor.organizationId! } };

    const candidate = await this.candidateRepository.findOne({
      where,
      relations,
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found or access denied');
    }

    return candidate;
  }

  /**
   * CRON JOB: Runs every midnight to Update incomplete users
   */
  @Cron('0 0 * * *') // Runs every midnight
  async deleteIncompleteUsers() {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      const result = await this.candidateRepository
        .createQueryBuilder()
        .update()
        .set({ application_stage: 'inactive' })
        .where('application_stage IN (:...stages)', {
          stages: ['registered', 'otp_verified', 'test_completed'],
        })
        .andWhere('createdAt < :timeLimit', { timeLimit: twentyFourHoursAgo })
        .execute();

      this.logger.log(
        `Marked ${result.affected ?? 0} incomplete users as inactive.`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to mark incomplete users as inactive.',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async resetCandidateRound(candidateId: number, round: number) {
    await this.attemptRepo.delete({ candidate: { id: candidateId }, round });
    const user = await this.candidateRepository.findOne({
      where: { id: candidateId },
    });
    if (user) {
      if (round === 1) {
        user.score = 0;
        await this.candidateRepository.save(user);
      } else {
        user.secondRoundScore = 0;
        await this.candidateRepository.save(user);
      }
    }
  }

  /**
   * Create a user (without files)
   */
  async createUser(data: CreateCandidateDto): Promise<Candidate> {
    console.log('Received Data:', data); // Debugging log
    const organizationId = data.organization?.id;
    if (!organizationId) {
      throw new BadRequestException('Organization is required');
    }

    const existingUserWhere: FindOptionsWhere<Candidate> = data.adminUser
      ? {
          email: data.email.toLowerCase(),
          organization: { id: organizationId },
          adminUser: { id: data.adminUser.id },
        }
      : {
          email: data.email.toLowerCase(),
          organization: { id: organizationId },
        };

    // Find existing user by email
    const existingUser = await this.candidateRepository.findOne({
      where: existingUserWhere,
      relations: ['role'],
    });

    // Find or create the role
    const foundRole = await this.userRoleRepository.findOne({
      where: { name: data.desiredRole },
    });
    const existingRole = foundRole
      ? foundRole
      : await this.userRoleRepository.save(
          this.userRoleRepository.create({ name: data.desiredRole }),
        );

    if (existingUser) {
      if (existingUser.finalized && existingUser.secondRoundFinalized) {
        throw new BadRequestException('You have completed all rounds.');
      }
      if (existingUser.finalized === false) {
        await this.resetCandidateRound(existingUser.id, 1);
      } else {
        await this.resetCandidateRound(existingUser.id, 2);
      }
      const otp = Math.floor(100000 + Math.random() * 900000);

      // If they are shortlisted, allow continuing without bumping first-round attempts
      const isShortlisted = existingUser.status === 'Shortlisted';

      const updatedUser = {
        ...existingUser,
        otp,
        application_stage: 'registered',
        otpVerifiedAt: null,
        score: isShortlisted ? existingUser.score : 0, // keep first-round score
        secondRoundScore: 0,
        attempt_number: isShortlisted
          ? existingUser.attempt_number // don’t change first-round attempts
          : existingUser.attempt_number + 1,
        secondRoundAttemptNumber: isShortlisted
          ? existingUser.secondRoundAttemptNumber + 1 // track second round separately
          : 0,
        firstName: data.firstName,
        lastName: data.lastName,
        countryCode: data.countryCode,
        phoneNumber: data.phoneNumber,
        qualification: data.qualification,
        yearOfPassedOut: data.yearOfPassedOut,
        passPercentage: data.passPercentage,
        currentCity: data.currentCity,
        desiredRole: data.desiredRole,
        workExperience: data.workExperience,
        resume: data.resume ?? null,
        idProof: data.idProof ?? null,
        role:
          !existingUser.role || existingUser.role.id !== existingRole.id
            ? existingRole
            : existingUser.role,
      };

      await this.candidateRepository.save(updatedUser);

      // Send a new OTP to email
      try {
        await this.candidateNotificationService.sendUserConfirmation(
          updatedUser.email,
          otp,
          updatedUser.firstName,
          organizationId,
        );
      } catch (error) {
        console.error('Failed to send OTP email:', error);
        updatedUser.otp = 999999;
        await this.candidateRepository.save(updatedUser);
      }

      return updatedUser;
    }

    // Create new user if no previous registration found
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Create and save new user
    const newUser = this.candidateRepository.create({
      ...data,
      email: data.email.toLowerCase(),
      otp,
      application_stage: 'registered',
      attempt_number: 1,
      role: existingRole,
    });

    try {
      await this.candidateNotificationService.sendUserConfirmation(
        newUser.email.toLowerCase(),
        otp,
        newUser.firstName,
        organizationId,
      );
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      // Fallback to default OTP and still save the user
      newUser.otp = 999999;
    }

    return await this.candidateRepository.save(newUser);
  }

  /**
   * Upload Documents (Resume & ID Proof) and update DB with file URLs
   */
  async uploadUserDocuments(
    userId: number,
    resumeFile: Express.Multer.File,
    idProofFile?: Express.Multer.File | null, // Make it optional
  ) {
    return this.candidateDocumentService.uploadUserDocuments(
      userId,
      resumeFile,
      idProofFile,
    );
  }

  /**
   * Upload Video and update DB with file URL
   */
  async uploadUserVideo(userId: number, videoFile: Express.Multer.File) {
    return this.candidateDocumentService.uploadUserVideo(userId, videoFile);
  }

  /**
   * Retrieve User Documents from S3
   */
  async getUserDocuments(userId: number, actor: StaffActor) {
    return this.candidateDocumentService.getUserDocuments(userId, actor);
  }

  /**
   * Retrieve User Video from S3
   */
  async getUserVideos(userId: number, actor: StaffActor) {
    return this.candidateDocumentService.getUserVideos(userId, actor);
  }

  /**
   * Retrieve all users
   */
  async getUsers(
    adminId: number,
    page?: number,
    limit?: number,
  ): Promise<Candidate[] | PaginatedResponse<Candidate>> {
    const pagination = resolvePagination(page, limit);

    if (!pagination) {
      return this.candidateRepository.find({
        where: { adminUser: { id: adminId } },
        relations: ['feedbacks', 'interviews'],
        order: { createdAt: 'DESC' },
      });
    }

    const [candidates, total] = await this.candidateRepository.findAndCount({
      where: { adminUser: { id: adminId } },
      relations: ['feedbacks', 'interviews'],
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return buildPaginatedResponse(candidates, total, pagination.page, pagination.limit);
  }

  /**
   * Get User by ID
   */
  async getUserByIdToAPP(id: number): Promise<Candidate> {
    const user = await this.candidateRepository.findOne({
      where: { id: id },
      relations: ['feedbacks'], //Include CandidateRound data
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  /**
   * Get User by ID
   */
  async getUserById(id: number, adminId: number): Promise<Candidate> {
    const user = await this.candidateRepository.findOne({
      where: {
        id: id,
        adminUser: { id: adminId }, // Enforce admin-level access
      },
      relations: ['feedbacks'], // Include associated data
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found or access denied`);
    }
    return user;
  }

  /**
   * Get User by ID
   */
  async getUserByIdToConsole(id: number): Promise<Candidate> {
    const user = await this.candidateRepository.findOne({
      where: { id: id },
      relations: ['feedbacks'],
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  /**
   * Update User Details
   */
  async updateUser(id: number, data: UpdateCandidateDto, adminId: number): Promise<Candidate> {
    await this.getUserById(id, adminId);
    await this.candidateRepository.update(id, data);
    return this.getUserById(id, adminId);
  }

  /**
   * Delete User
   */
  async deleteUser(id: number, adminId: number): Promise<void> {
    const user = await this.candidateRepository.findOne({
      where: { id, adminUser: { id: adminId } },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found or not authorized to delete`);
    }
    await this.candidateRepository.delete(id);
  }

  /**
   * Verify OTP
   */
  async verifyOtp(id: string, otp: string) {
    const user = await this.candidateRepository.findOne({
      where: { id: parseInt(id) },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.otp !== parseInt(otp)) {
      return {
        success: false,
        message: 'OTP Invalid',
      };
    }

    user.application_stage = 'otp_verified';
    user.otpVerifiedAt = new Date();
    await this.candidateRepository.save(user);

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  }

  /**
   * Update User Status (admin-scoped — legacy, kept for backward compat)
   */
  async updateUserStatus(userId: number, status: string, adminId: number): Promise<Candidate> {
    const user = await this.candidateRepository.findOne({
      where: { id: userId, adminUser: { id: adminId } },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${userId} not found or you are not authorized to update this user`,
      );
    }

    user.status = status;

    // Send mail confirmation (non-blocking)
    try {
      await this.candidateNotificationService.sendStatusUpdateNotification(
        user,
        status,
        adminId,
      );
    } catch (error) {
      console.error(`Failed to send ${status} status email to ${user.email}:`, error);
    }

    return await this.candidateRepository.save(user);
  }

  /**
   * Update User Status — org-scoped (works for admin, hr, interviewer)
   */
  async updateUserStatusByActor(userId: number, status: string, actor: StaffActor): Promise<Candidate> {
    // Reuses getAccessibleCandidate which scopes by org (or no scope for superadmin)
    const user = await this.getAccessibleCandidate(userId, actor);

    user.status = status;

    // Send mail confirmation (non-blocking)
    try {
      await this.candidateNotificationService.sendStatusUpdateNotification(
        user,
        status,
        actor.organizationId ?? 0,
      );
    } catch (error) {
      console.error(`Failed to send ${status} status email to ${user.email}:`, error);
    }

    return await this.candidateRepository.save(user);
  }

  async sendInterviewNotifications(interview: Interview) {
    await this.candidateNotificationService.sendInterviewNotifications(interview);
  }

  async assignInterviewer(candidateId: number, interviewerId: number, adminId: number) {
    // Fetch candidate with admin check
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId, adminUser: { id: adminId } },
      relations: ['assignedInterviewer'],
    });

    if (!candidate) throw new NotFoundException('Candidate not found or unauthorized access');

    // Fetch interviewer — scope by organization (not createdBy) so all org interviewers are accessible
    const interviewer = await this.interviewerRepo.findOne({
      where: { id: interviewerId },
      relations: ['candidates'],
    });

    if (!interviewer) throw new NotFoundException('Interviewer not found or unauthorized access');

    // Remove candidate from any previously assigned interviewer's candidates array
    if (candidate.assignedInterviewer?.candidates) {
      candidate.assignedInterviewer.candidates = candidate.assignedInterviewer.candidates.filter(
        (c) => c.id !== candidate.id,
      );
      await this.interviewerRepo.save(candidate.assignedInterviewer);
    }

    // Assign new interviewer
    candidate.assignedInterviewer = interviewer;

    // Avoid duplicate assignment
    const alreadyAssigned = interviewer.candidates.some((c) => c.id === candidate.id);
    if (!alreadyAssigned) {
      interviewer.candidates.push(candidate);
    }

    // Save changes
    await this.candidateRepository.save(candidate);
    await this.interviewerRepo.save(interviewer);

    return {
      candidate: {
        id: candidate.id,
        name: `${candidate.firstName} ${candidate.lastName}`,
      },
      interviewer: {
        id: interviewer.id,
        name: interviewer.name,
        email: interviewer.email,
      },
    };
  }

  /**
   * Schedule an Interview
   */
  async scheduleInterview(candidateId: number, date: Date) {
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
    });
    if (!candidate) throw new NotFoundException('Candidate not found');

    candidate.interviewScheduledAt = date;
    return await this.candidateRepository.save(candidate);
  }

  /**
   * Fetch all candidates with their interview details
   */
  async getAllCandidatesWithInterviews(
    actor: StaffActor,
    page?: number,
    limit?: number,
  ): Promise<Candidate[] | PaginatedResponse<Candidate>> {
    this.ensureOrganizationScope(actor);
    const pagination = resolvePagination(page, limit);
    const findOptions: FindManyOptions<Candidate> = {
      ...(this.isSuperAdmin(actor)
        ? {}
        : { where: { organization: { id: actor.organizationId! } } }),
      relations: ['assignedInterviewer'],
      order: { createdAt: 'DESC' as const },
    };

    if (!pagination) {
      return this.candidateRepository.find(findOptions);
    }

    const [candidates, total] = await this.candidateRepository.findAndCount({
      ...findOptions,
      skip: pagination.skip,
      take: pagination.limit,
    });

    return buildPaginatedResponse(candidates, total, pagination.page, pagination.limit);
  }

  /**
   * Fetch a specific candidate along with assigned interviewer
   */
  async getCandidateDetails(candidateId: number, actor: StaffActor) {
    return this.getAccessibleCandidate(candidateId, actor, ['assignedInterviewer']);
  }

  async getPreSignedUrl(
    fileKey: string,
    actor: StaffActor,
    forceDownload = false,
  ) {
    return this.candidateDocumentService.getPreSignedUrl(
      fileKey,
      actor,
      forceDownload,
    );
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string, adminId: number): Promise<Candidate | null> {
    return this.candidateRepository.findOne({
      where: { email: email.toLowerCase(), adminUser: { id: adminId } },
    });
  }

  /**
   * Continue from Where the User Stopped
   * @param email
   * @returns
   */
  async resumeProcess(email: string) {
    const user = await this.candidateRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return {
      message: 'Resuming process...',
      nextStep: user.application_stage, // Guide the frontend to the next step
    };
  }

  /**
   * Restart the Process from the Beginning
   * @param email
   * @returns
   */
  async restartProcess(email: string) {
    const user = await this.candidateRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    // Reset progress
    user.application_stage = 'registered';
    user.otpVerifiedAt = null;
    user.testCompletedAt = null;
    user.videoSubmittedAt = null;
    user.attempt_number += 1; // Increment attempt count

    return await this.candidateRepository.save(user);
  }
}
