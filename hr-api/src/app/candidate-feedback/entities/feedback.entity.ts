import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Candidate } from '../../candidate/entities/candidate.entity'; // Candidate entity
import { AdminUser } from '../../users/entities/users.entity'; // Recruiters/Admin entity

@Entity()
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Candidate, (candidate) => candidate.feedbacks, { onDelete: 'CASCADE' })
  candidate: Candidate;

  @ManyToOne(() => AdminUser, (admin) => admin.feedbacks, { nullable: true, onDelete: 'SET NULL' })
  submittedBy: AdminUser;  // Admin or Recruiter who provided feedback

  @Column('text')
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}
