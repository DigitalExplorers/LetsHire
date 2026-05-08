import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview } from '../../app/interview/entities/interview.entity';
import { Candidate } from '../candidate/entities/candidate.entity';
import { Interviewer } from '../interviewer/entities/interviewer.entity';
import { CandidateService } from '../candidate/candidate.service';
import { FeedbackDto } from './dto/feedback.dto';
import { AdminUser } from '../users/entities/users.entity';
import {
  buildPaginatedResponse,
  PaginatedResponse,
  resolvePagination,
} from '../../common/pagination/pagination.util';

@Injectable()
export class InterviewService {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepo: Repository<Interview>,

    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,

    @InjectRepository(Interviewer)
    private readonly interviewerRepo: Repository<Interviewer>,

    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,

    private readonly candidateService: CandidateService
  ) {}

  async scheduleInterview(candidateId: number, interviewerId: number, date: Date, adminId: number) {
    // Fetch candidate entity
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId, adminUser: { id: adminId } },
      relations: ["assignedInterviewer"],
    });
    if (!candidate) throw new NotFoundException("Candidate not found or access denied");

    // Fetch interviewer entity — scope by id only (org-level access, not createdBy)
    const interviewer = await this.interviewerRepo.findOne({ where: { id: interviewerId } });
    if (!interviewer) throw new NotFoundException("Interviewer not found or access denied");

    // Fetch all previous interview records for the candidate
    const previousInterviews = await this.interviewRepo.find({
      where: { candidate: { id: candidateId } },
    });

    // Determine the next round number
    const nextRound = previousInterviews.length + 1;

    // Create a new interview entry instead of updating an existing one
    const interview = this.interviewRepo.create({
      candidate,
      interviewer,
      round: nextRound,
      scheduledDate: date,
      createdBy: { id: adminId },
      organization: {id: candidate.organization.id}
    });

    // Save the new interview record
    await this.interviewRepo.save(interview);

    // Update the candidate entity
    candidate.interviewScheduledAt = date;
    candidate.assignedInterviewer = interviewer;

    await this.candidateRepo.save(candidate);
    await this.candidateService.sendInterviewNotifications(interview);
    
    return interview;
}


  // async getAllInterviews(adminId: number) {
  //   return await this.interviewRepo.find({
  //     relations: ["candidate", "interviewer"], // Include candidate and interviewer details
  //   });
  // }

  async getAllInterviews(
    adminId: number,
    page?: number,
    limit?: number,
  ): Promise<Interview[] | PaginatedResponse<Interview>> {
    const pagination = resolvePagination(page, limit);

    if (!pagination) {
      return this.interviewRepo.find({
        where: { createdBy: { id: adminId } },
        relations: ['candidate', 'interviewer'],
        order: { createdAt: 'DESC' },
      });
    }

    const [interviews, total] = await this.interviewRepo.findAndCount({
      where: { createdBy: { id: adminId } },
      relations: ['candidate', 'interviewer'],
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return buildPaginatedResponse(interviews, total, pagination.page, pagination.limit);
  }

  async getInterviewersWithCandidates(): Promise<Interviewer[]> {
    return await this.interviewerRepo.find({
      relations: ['interviews', 'interviews.candidate'], // Fetch interviews & candidates
    });
  }

  // async getCandidatesByInterviewer(interviewerId: number, adminId: number): Promise<User[]> {
  //   const interviews = await this.interviewRepo.find({
  //     where: { interviewer: { id: interviewerId } },
  //     relations: ['candidate'], // Ensure candidate details are fetched
  //   });
  
  //   if (!interviews.length) {
  //     throw new NotFoundException(`No candidates assigned to interviewer ID ${interviewerId}`);
  //   }
  
  //   return interviews.map((interview) => interview.candidate);
  // }

  private async resolveInterviewerIdForCurrentUser(
    requestedInterviewerId: number,
    currentUser: {
      userId: number;
      email: string;
      role?: string;
      organizationId?: number | null;
    },
  ): Promise<number> {
    if (currentUser.role !== 'interviewer') {
      return requestedInterviewerId;
    }

    const normalizedEmail = currentUser.email?.toLowerCase();
    const where =
      currentUser.organizationId != null
        ? [
            { id: currentUser.userId, organization: { id: currentUser.organizationId } },
            { email: normalizedEmail, organization: { id: currentUser.organizationId } },
          ]
        : [{ id: currentUser.userId }, { email: normalizedEmail }];

    const interviewer = await this.interviewerRepo.findOne({ where });

    if (!interviewer) {
      throw new NotFoundException('Interviewer profile not found for the logged-in user');
    }

    return interviewer.id;
  }

  async getCandidatesByInterviewer(
    interviewerId: number,
    currentUser: {
      userId: number;
      email: string;
      role?: string;
      organizationId?: number | null;
    },
  ): Promise<Candidate[]> {
    const effectiveInterviewerId = await this.resolveInterviewerIdForCurrentUser(
      interviewerId,
      currentUser,
    );

    const interviews = await this.interviewRepo.find({
      where:
        currentUser.organizationId != null
          ? {
              interviewer: { id: effectiveInterviewerId },
              organization: { id: currentUser.organizationId },
            }
          : { interviewer: { id: effectiveInterviewerId } },
      relations: ['candidate'],
      order: { scheduledDate: 'DESC' },
    });

    // Multiple interview records can exist for the same candidate (for example,
    // reschedules or additional rounds). The Assigned Interviews tab expects one
    // row per candidate, so keep only the most recent record for each candidate.
    const latestCandidateById = new Map<number, Candidate>();

    for (const interview of interviews) {
      const candidate = interview.candidate;
      if (candidate && !latestCandidateById.has(candidate.id)) {
        latestCandidateById.set(candidate.id, candidate);
      }
    }

    return Array.from(latestCandidateById.values());
  }


  // Submit Feedback and Score for an Interview
  async submitFeedback(interviewId: number, feedback: string, score: number, adminId: number) {
    const interview = await this.interviewRepo.findOne({ where: { id: interviewId }, relations: ["createdBy"] });
    if (!interview || interview.createdBy.id !== adminId) throw new UnauthorizedException();

    interview.feedback = feedback;
    interview.score = score;
    return await this.interviewRepo.save(interview);
  }

  // Get All Interview Rounds for a Candidate (org-scoped)
  async getCandidateInterviews(
    candidateId: number,
    actor: { role?: string; organizationId?: number | null },
  ) {
    const isSuperAdmin = actor.role === 'superadmin';
    return this.interviewRepo.find({
      where: isSuperAdmin
        ? { candidate: { id: candidateId } }
        : { candidate: { id: candidateId }, organization: { id: actor.organizationId! } },
      relations: ['interviewer'],
      order: { round: 'ASC' },
    });
  }

  // Promote Candidate to the Next Round (Manager Action)
  async promoteCandidateToNextRound(candidateId: number, interviewerId: number, date: Date, adminId: number) {
    const candidate = await this.candidateRepo.findOne({ where: { id: candidateId } });
    if (!candidate) throw new NotFoundException('Candidate not found');

    // Get last interview and check score
    const lastInterview = await this.interviewRepo.findOne({
      where: { candidate: { id: candidateId }, createdBy: { id: adminId } },
      order: { round: "DESC" },
    });

    if (!lastInterview) throw new BadRequestException("No previous interview found");

    if (lastInterview.score < 7) {
      throw new BadRequestException("Candidate did not pass the previous round");
    }

    return await this.scheduleInterview(candidateId, interviewerId, date, adminId);
  }

  getCandidateCurrentRound(candidate: Candidate): number {
    if (candidate.finalized) {
      return 2;
    }
    return 1;
  }


  /**
   * Submit Screening Round
   * - Only accepts candidateId, round (1), score, and feedback.
   * - Prevents duplicate screening rounds.
   * - Stores screening data in the `Interview` table.
   */
  async submitScreeningRound(data: {
    candidateId: number;
    score: number;
    feedback: string;
    createdBy: { id: number };
    organization: { id: number };
  }) {
    const adminId = data.createdBy.id;
    const organizationId = data.organization.id;
    //  Ensure candidate exists
    const candidate = await this.candidateRepo.findOne({ where: { id: data.candidateId } });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    // Determine which round they are in
    const round = this.getCandidateCurrentRound(candidate);
  
    // Update candidate progress
    candidate.application_stage = "test_completed";
    candidate.testCompletedAt = new Date();
    await this.candidateRepo.save(candidate);
  
    // Check for existing screening round
    const existingScreening = await this.interviewRepo.findOne({
      where: { candidate: { id: data.candidateId }, round: round },
    });
  
    const screeningRound = existingScreening
      ? this.interviewRepo.merge(existingScreening, {
          score: round===2 ? candidate.secondRoundScore : candidate.score,
          feedback: `Screening round ${round} submitted successfully`,
          status: 'Completed',
          scheduledDate: new Date(),
          createdBy: { id: adminId } as any,
          organization: { id: organizationId } as any
        })
      : this.interviewRepo.create({
          candidate,
          round: round,
          score: round===2 ? candidate.secondRoundScore : candidate.score,
          feedback: `Screening round ${round} submitted successfully`,
          status: 'Completed',
          scheduledDate: new Date(),
          createdBy: { id: adminId } as any,
          organization: { id: organizationId } as any
        });
  
    await this.interviewRepo.save(screeningRound);
    await this.candidateRepo.save(candidate);

    return {
      message: existingScreening
        ? `Screening Round ${round} updated successfully!`
        : `Screening Round ${round} submitted successfully!`
    };
  }

  async submitInterviewFeedback(candidateId: number, round: number, feedback: string, score: number, adminId: number) {
    // Find the interview record for the given candidate and round
    const interview = await this.interviewRepo.findOne({
      where: { candidate: { id: candidateId }, round, createdBy: { id: adminId } },
      relations: ["candidate", "interviewer"],
    });

    if (!interview) {
        throw new NotFoundException(`Interview record for round ${round} not found for candidate ID ${candidateId}`);
    }

    // Update the interview record with feedback and score
    interview.feedback = feedback;
    interview.score = score;

    await this.interviewRepo.save(interview);

    return { message: `Feedback for round ${round} submitted successfully!`, interview };
  }

  async addFeedback(feedbackDto: FeedbackDto, adminId: number) {
    const { candidateId, round, score, strengths, weaknesses, comments } = feedbackDto;

    // Find the existing interview record
    const interview = await this.interviewRepo.findOne({
      where: { candidate: { id: candidateId }, round, createdBy: { id: adminId } },
      relations: ['candidate', 'interviewer'],
    });

    if (!interview) throw new NotFoundException('Interview round not found');

    // Store feedback in a structured format
    interview.feedback = `**Strengths:** ${strengths}\n**Weaknesses:** ${weaknesses}\n**Comments:** ${comments}`;
    interview.score = score;

    await this.interviewRepo.save(interview);

    return interview;
  }


}
