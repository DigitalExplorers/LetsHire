import { Organization } from '../../organization/entities/organization.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

@Entity()
export class RegistrationLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  token: string;

  @Column()
  adminId: number;

  @Column()
  organizationId: number;

  @Column()
  roleId: number;

  @Column({ type: 'timestamp', nullable: true })
  examStartTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  examEndTime: Date;

  @CreateDateColumn()
  createdAt: Date;
}