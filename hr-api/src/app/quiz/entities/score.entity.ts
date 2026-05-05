import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Candidate } from '../../candidate/entities/candidate.entity';

@Entity()
export class Score {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Candidate, { cascade: true })
  user: Candidate;

  @Column()
  score: number;
}
