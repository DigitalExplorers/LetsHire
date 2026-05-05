import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Quiz } from '../../quiz/entities/quiz.entity';
import { AdminUser } from '../../users/entities/users.entity';
import { Organization } from '../../organization/entities/organization.entity';

@Entity('positions')
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({nullable: true})
  description: string;

  @Column({nullable: true})
  experienceRequired: number;

  @OneToMany(() => Quiz, (quiz) => quiz.role)
  quizzes: Quiz[];

  @ManyToOne(() => AdminUser, { eager: true, nullable: true })
  createdBy: AdminUser;
  
  @ManyToOne(() => Organization, { eager: true })
  organization: Organization;
}