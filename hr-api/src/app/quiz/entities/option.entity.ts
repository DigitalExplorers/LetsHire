import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Quiz } from './quiz.entity';

@Entity()
export class Option {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column()
  isCorrect: boolean;

  @ManyToOne(() => Quiz, (quiz) => quiz.options, {
    onDelete: 'CASCADE',
  })
  quiz: Quiz;
}
