import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { Candidate } from '../../candidate/entities/candidate.entity';
import { Exclude, Transform } from 'class-transformer';
import { Interview } from '../../interview/entities/interview.entity';
import { AdminUser } from '../../users/entities/users.entity';
import { Organization } from '../../organization/entities/organization.entity';


@Entity()
export class Interviewer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column('simple-array')
  skills: string[]; // Example: ["React", "Java", "AWS"]

  @Column()
  department: string; // Example: "Engineering", "HR"

  @Column({ default: 'Available' })
  availability: string; // Available, Busy

  // @OneToMany(() => User, (user) => user.assignedInterviewer, { cascade: true })
  // @Exclude()
  // candidates: User[]; // This tracks assigned candidates

  @OneToMany(() => Candidate, (user) => user.assignedInterviewer, { cascade: true})
  @Transform(({ value }) =>
    value
      ? value.map((user: Candidate) => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
        }))
      : [],
  )
  candidates: Candidate[];

  @OneToMany(() => Interview, (interview) => interview.interviewer, {
    cascade: true,
  })
  interviews: Interview[];

  @ManyToOne(() => AdminUser, { eager: true, nullable: true })
  createdBy: AdminUser;

  @ManyToOne(() => Organization, { eager: true })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
