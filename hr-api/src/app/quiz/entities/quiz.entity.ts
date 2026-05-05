import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Option } from './option.entity';
import { UserRole } from '../../user-role/entities/user.role.entity';
import { AdminUser } from '../../users/entities/users.entity';
import { Organization } from '../../organization/entities/organization.entity';

@Entity()
export class Quiz {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserRole, (role) => role.quizzes, { nullable: true, onDelete: 'CASCADE' })
  role?: UserRole;

  @Column()
  question: string;

  @OneToMany(() => Option, (option) => option.quiz, { cascade: true, onDelete: 'CASCADE', })
  options: Option[];
  
  @ManyToOne(() => AdminUser, { eager: true, nullable: true, onDelete: 'CASCADE' })
  createdBy: AdminUser;

  @ManyToOne(() => Organization, { eager: true })
  organization: Organization;

  @Column({ default: 'active' })
  status: 'active' | 'inactive';

  @Column({ type: 'int', default: 1 })
  round: number;
}
