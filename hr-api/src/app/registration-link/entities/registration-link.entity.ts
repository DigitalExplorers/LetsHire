import { Organization } from '../../organization/entities/organization.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

@Entity()
export class RegistrationLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  token: string;

  @Column()
  adminId: string;

  @Column()
  organizationId: string;

  @Column()
  roleId: string;

  @Column({ type: 'timestamp', nullable: true })
  examStartTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  examEndTime: Date;

  @CreateDateColumn()
  createdAt: Date;
}
