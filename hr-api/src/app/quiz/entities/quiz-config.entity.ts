import { UserRole } from '../../user-role/entities/user.role.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { AdminUser } from '../../users/entities/users.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class QuizConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 20 }) // Default value
  numberOfQuestions: number;


  @Column({ default: 45 }) // New column for per-question time
  timePerQuestionInSeconds: number;

  @ManyToOne(() => UserRole, { eager: true, nullable: true, onDelete: 'CASCADE'  })
  role: UserRole;

  @ManyToOne(() => AdminUser, { eager: true, nullable: true, onDelete: 'CASCADE' })
  createdBy: AdminUser;

  @ManyToOne(() => Organization, { eager: true })
  organization: Organization;
}
