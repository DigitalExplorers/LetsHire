import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate, OneToMany, ManyToOne, Unique, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Exclude } from 'class-transformer';
import { Feedback } from '../../candidate-feedback/entities/feedback.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { Role } from '../../role/entities/role.entity';

@Entity('users')
@Unique(['email', 'organization'])
export class AdminUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ nullable: false })
  email: string;

  // Never expose the password hash in API responses.
  @Exclude()
  @Column({ nullable: false })
  password: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (!this.password) {
      return;
    }

    const alreadyHashed =
      this.password.startsWith('$2a$') ||
      this.password.startsWith('$2b$') ||
      this.password.startsWith('$2y$');

    if (!alreadyHashed) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @OneToMany(() => Feedback, (feedback) => feedback.submittedBy, {
    cascade: true,
  })
  feedbacks: Feedback[];

  @ManyToOne(() => Organization, { eager: true })
  organization: Organization;

  @Column({ default: false })
  isSuperAdmin: boolean;

  @ManyToOne(() => Role, (role) => role.users, { eager: true, nullable: true })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
