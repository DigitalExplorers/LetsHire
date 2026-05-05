import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AdminUser } from '../../users/entities/users.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // e.g. 'hr', 'interviewer'

  @Column()
  displayName: string; // e.g. 'Human Resources', 'Interviewer'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => AdminUser, (user) => user.role)
  users: AdminUser[];
}
