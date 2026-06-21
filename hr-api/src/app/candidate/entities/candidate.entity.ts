import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, Unique, JoinColumn} from 'typeorm';
import {IsUUID} from 'class-validator';
import { Feedback } from '../../candidate-feedback/entities/feedback.entity';
import { Interviewer } from '../../interviewer/entities/interviewer.entity';
import { Exclude, Transform, Type } from 'class-transformer';
import { Interview } from '../../interview/entities/interview.entity';
import { UserRole } from '../../user-role/entities/user.role.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { AdminUser } from '../../users/entities/users.entity';

@Unique(['email', 'adminUser'])
@Entity()
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  countryCode: string;

  @Column()
  phoneNumber: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  qualification: string;

  @Column({ nullable: true })
  @Type(() => Number)
  yearOfPassedOut: number;

  @Column({ type: 'float', nullable: true })
  @Type(() => Number) 
  passPercentage: number;

  // The column will be exluded in api responses.
  @Exclude()
  @Column()
  otp: number;

  @Column({ nullable: true })
  currentCity: string;

  @Column({ nullable: true })
  desiredRole: string;

  @ManyToOne(() => UserRole, { nullable: true, eager: true })
  role: UserRole;

  @Column({ type: 'int', nullable: true })
  workExperience: number;

  @Column({ type: 'varchar', nullable: true })
  resume: string | null; // File path for resume

  @Column({ type: 'varchar', nullable: true })
  idProof: string | null; // File path for ID proof

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 0 })
  score: number;

  @Column({ default: 0 })
  secondRoundScore: number;

  @Column({ default: 'Applied' })
  status: string;

  // New Columns for Video Analysis
  @Column({ type: 'varchar', nullable: true })
  videoPath: string | null;

  @Column({ type: 'jsonb', nullable: true })
  videoAnalysis: any; // Store analysis results as JSON

  @OneToMany(() => Feedback, (feedback) => feedback.candidate, { cascade: true })
  feedbacks: Feedback[];

  @ManyToOne(() => Interviewer, (interviewer) => interviewer.candidates, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  @Transform(({ value }) =>
    value ? { id: value.id, name: value.name, email: value.email } : null,
  )
  assignedInterviewer: Interviewer | null;

  @OneToMany(() => Interview, (interview) => interview.candidate)
  interviews: Interview[];

  @Column({ type: 'timestamp', nullable: true })
  interviewScheduledAt: Date | null;

  @Column({ default: 'registered' })
  application_stage: string;

  @Column({ default: 1 })
  attempt_number: number; // Tracks how many times the user has retaken the process

  @Column({ default: 0 })
  secondRoundAttemptNumber: number;

  @Column({ default: false })
  secondRoundFinalized: boolean;

  @Column({ default: false }) 
  finalized: boolean; // Prevents re-registration after video submission

  @Column({ type: 'timestamp', nullable: true })
  otpVerifiedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  testCompletedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  videoSubmittedAt: Date | null;

  @ManyToOne(() => AdminUser, { nullable: true, eager: true })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser: AdminUser;

  @ManyToOne(() => Organization, { eager: true })
  organization: Organization;
  
}
