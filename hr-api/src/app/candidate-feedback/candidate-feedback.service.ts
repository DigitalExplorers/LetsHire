import { Injectable, NotFoundException } from '@nestjs/common';
import { Feedback } from './entities/feedback.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from '../candidate/entities/candidate.entity';
import { AdminUser } from '../users/entities/users.entity'; // Recruiters/Admin entity
import { FeedbackDto } from './dto/feedback.dto';

@Injectable()
export class CandidateFeedbackService {

    constructor(
        @InjectRepository(Feedback)
        private feedbackRepository: Repository<Feedback>,
        @InjectRepository(Candidate)
        private candidateRepository: Repository<Candidate>,
        @InjectRepository(AdminUser)
        private adminRepository: Repository<AdminUser>
      ) {}
    
      async addFeedback(candidateId: number, adminId: number, feedbackDto: FeedbackDto) {
        console.log("candidateId ",candidateId);
        console.log("adminId ",adminId);
        
        const admin = await this.adminRepository.findOne({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('Admin/Recruiter not found');
    
        const candidate = await this.candidateRepository.findOne({ where: { id: candidateId } });
        if (!candidate) throw new NotFoundException('Candidate not found');
    
        const feedback = this.feedbackRepository.create({
          candidate,
          submittedBy: admin,
          comment: feedbackDto.comment
        });
    
        return await this.feedbackRepository.save(feedback);
      }
    
      async getFeedbacks(candidateId: number) {
        return await this.feedbackRepository.find({
          where: { candidate: { id: candidateId } },
          relations: ['submittedBy'],
          order: { createdAt: 'DESC' }
        });
      }

}
