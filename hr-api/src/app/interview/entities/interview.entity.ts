import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Candidate } from '../../candidate/entities/candidate.entity';
import { Interviewer } from '../../interviewer/entities/interviewer.entity';
import { AdminUser } from '../../users/entities/users.entity';
import { Organization } from '../../organization/entities/organization.entity';

@Entity()
export class Interview {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Candidate, (candidate) => candidate.interviews, { eager: true, onDelete: 'CASCADE' })
  candidate: Candidate;
  
  @ManyToOne(() => Interviewer, (interviewer) => interviewer.interviews, { eager: true, onDelete: 'CASCADE' })
  interviewer: Interviewer;

  @Column({ type: "int", default: 1 })
  round: number;  // Tracks interview rounds

  @Column({ type: 'text', nullable: true })
  feedback: string;  // Stores interviewer's feedback

  @Column({ type: "float", nullable: true })
  score: number;  // Stores the interview score

  @Column({ default: 'Pending' })  // Pending, Completed, In Progress
  status: string;

  @Column()
  scheduledDate: Date;

  @ManyToOne(() => AdminUser, { eager: true, nullable: true })
  createdBy: AdminUser;

  @ManyToOne(() => Organization, { eager: true })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
