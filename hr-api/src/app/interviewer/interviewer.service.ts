import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interviewer } from './entities/interviewer.entity';
import { CreateInterviewerDto } from './dto/create-interviewer.dto';
import { UpdateInterviewerDto } from './dto/update-interviewer.dto';
import { Candidate } from '../candidate/entities/candidate.entity';
import { AdminUser } from '../users/entities/users.entity';

@Injectable()
export class InterviewerService {
  constructor(
    @InjectRepository(Interviewer)
    private readonly interviewerRepository: Repository<Interviewer>,
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>
  ) {}

  // Create a new interviewer
  async createInterviewer(dto: CreateInterviewerDto): Promise<Interviewer> {
    const admin = await this.adminRepo.findOne({
      where: { id: dto.createdBy },
      relations: ['organization'],
    });
    if (!admin) throw new NotFoundException('Admin user not found');
  
    const interviewer = this.interviewerRepository.create({
      ...dto,
      createdBy: admin,
      organization: admin.organization, // automatically inherit the admin's org
    });
    return await this.interviewerRepository.save(interviewer);
  }

  // Get all interviewers (Filter by skills)
  // async getInterviewers(skills?: string[]): Promise<Interviewer[]> {
  //   if (skills) {
  //     return await this.interviewerRepository
  //       .createQueryBuilder("interviewer")
  //       .where("interviewer.skills && ARRAY[:...skills]::varchar[]", { skills })
  //       .getMany();
  //   }
  //   return await this.interviewerRepository.find();
  // }

  async getInterviewers(organizationId: number, skills?: string[]): Promise<Interviewer[]> {
    const query = this.interviewerRepository.createQueryBuilder('interviewer')
      .leftJoinAndSelect('interviewer.organization', 'organization')
      .where('organization.id = :organizationId', { organizationId });

    if (skills && skills.length > 0) {
      query.andWhere('interviewer.skills && ARRAY[:...skills]::varchar[]', { skills });
    }

    return await query.getMany();
  }

  async getInterviewersByAdmin(adminId: number): Promise<Interviewer[]> {
    return this.interviewerRepository.find({ where: { createdBy: { id: adminId } } });
  }

  // Get an interviewer by ID
  async getInterviewerById(id: number): Promise<Interviewer> {
    const interviewer = await this.interviewerRepository.findOne({
      where: { id },
    });
    if (!interviewer) throw new NotFoundException('Interviewer not found');
    return interviewer;
  }

  // Update interviewer details
  // async updateInterviewer(id: number, updateDto: UpdateInterviewerDto): Promise<Interviewer> {
  //   await this.getInterviewerById(id); // Ensure interviewer exists
  //   await this.interviewerRepository.update(id, updateDto);
  //   return this.getInterviewerById(id);
  // }

  async updateInterviewer(id: number, updateDto: UpdateInterviewerDto, adminId: number): Promise<Interviewer> {
    const interviewer = await this.getInterviewerById(id);
    if (interviewer.createdBy.id !== adminId) {
      throw new UnauthorizedException('You are not authorized to update this interviewer.');
    }
  
    // Convert createdBy ID to entity if present
    if ('createdBy' in updateDto && typeof updateDto.createdBy === 'number') {
      updateDto.createdBy = { id: updateDto.createdBy } as any;
    }
  
    await this.interviewerRepository.update(id, updateDto as any);
    return this.getInterviewerById(id);
  }
  

  // Delete an interviewer
  async deleteInterviewer(id: number, adminId: number): Promise<void> {
    const interviewer = await this.interviewerRepository.findOne({
      where: {
        id,
        createdBy: { id: adminId },
      },
    });

    if (!interviewer) {
      throw new NotFoundException(
        'Interviewer not found or you are not authorized to delete this interviewer',
      );
    }

    await this.interviewerRepository.delete(id);
  }

  async getInterviewersWithCandidates(
    includeCandidates: boolean,
  ): Promise<Interviewer[]> {
    if (includeCandidates) {
      return await this.interviewerRepository.find({
        relations: ['candidates'],
      });
    } else {
      return await this.interviewerRepository.find();
    }
  }

  async assignCandidate(interviewerId: number, candidateId: number) {
    const interviewer = await this.interviewerRepository.findOne({
      where: { id: interviewerId },
      relations: ['candidates'], // Ensure we fetch existing candidates
    });

    if (!interviewer) throw new NotFoundException('Interviewer not found');

    const candidate = await this.candidateRepo.findOne({
        where: { id: candidateId },
    });

    if (!candidate) throw new NotFoundException('Candidate not found');

    // Ensure the candidate is not already assigned to avoid duplicates
    const alreadyAssigned = interviewer.candidates.some(
      (c) => c.id === candidate.id,
    );
    if (!alreadyAssigned) {
      interviewer.candidates.push(candidate);
    }

    // Update the candidate's assigned interviewer
    candidate.assignedInterviewer = interviewer;

    // Save both entities
    await this.candidateRepo.save(candidate);
    await this.interviewerRepository.save(interviewer);

    return interviewer; // Return updated interviewer with candidates
  }
}
