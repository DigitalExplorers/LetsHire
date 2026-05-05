import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
  } from 'typeorm';
  import { Candidate } from '../../candidate/entities/candidate.entity';
  import { Quiz } from '../../quiz/entities/quiz.entity';
  import { Option } from '../../quiz/entities/option.entity';
  
  @Entity()
  export class CandidateTestAttempt {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => Candidate, candidate => candidate.id, { onDelete: 'CASCADE' })
    candidate: Candidate;
  
    @ManyToOne(() => Quiz, quiz => quiz.id, { eager: true })
    quiz: Quiz;
  
    @ManyToOne(() => Option, option => option.id, { eager: true, nullable: true })
    selectedOption: Option | null;
  
    @Column({ default: false })
    isCorrect: boolean;

    @Column({ type: "int", default: 1 })
    round: number;

    @Column({nullable : true})
    question_status: string;  // values: 'unattempted', 'answered', 'skipped'
  
    @CreateDateColumn()
    attemptedAt: Date;
  }
  