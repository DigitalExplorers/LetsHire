import { AdminUser } from "../../users/entities/users.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  bgImageUrl: string;

  @Column({ nullable: true })
  primaryColor: string;

  @Column({ nullable: true })
  policy: string;



  @Column({ default: 'active' })
  status: 'active' | 'inactive' | 'suspended';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => AdminUser, (admin) => admin.organization)
  admins: AdminUser[];
}
