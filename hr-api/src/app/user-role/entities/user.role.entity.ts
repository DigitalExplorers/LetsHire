import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Quiz } from '../../quiz/entities/quiz.entity';
import { AdminUser } from '../../users/entities/users.entity';
import { Organization } from '../../organization/entities/organization.entity';
import {IsUUID} from 'class-validator';
@Entity('positions')
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

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