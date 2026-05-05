import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../user-role/entities/user.role.entity';

@Injectable()
export class UserRoleSeeder {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  /**
   * Seed default roles if they don't exist
   */
  async seedRoles() {
    const predefinedRoles: string[] = [
      "Software Engineer",
      "Frontend Developer",
      "Backend Developer",
      "Full Stack Developer",
      "DevOps Engineer",
      "Data Scientist",
      "Machine Learning Engineer",
      "Cyber Security Analyst",
      "Cloud Engineer",
      "Database Administrator",
      "AI Engineer",
      "Embedded Systems Engineer",
      "QA Engineer",
      "Automation Test Engineer",
      "Manual Test Engineer",
      "Performance Test Engineer",
      "Security Test Engineer",
      "Game Developer",
      "Mobile App Developer",
      "Technical Writer",
      "Business Analyst",
      "Product Manager",
      "Scrum Master",
      "Software Architect",
      "System Administrator",
      "UI/UX Designer",
      "Technical Support Engineer",
      "IT Consultant",
      "Blockchain Developer",
      "Site Reliability Engineer (SRE)",
      "Networking Engineer",
      "Big Data Engineer",
      "IoT Engineer",
      "ERP Consultant",
      "Cloud Security Engineer",
      "Other",
    ];

    const existingRoles = await this.userRoleRepository.find();
    const existingRoleNames = existingRoles.map(role => role.name);

    const newRoles = predefinedRoles.filter(role => !existingRoleNames.includes(role));

    if (newRoles.length === 0) {
      console.log("All roles are already present in the database.");
      return { message: "All roles are already present in the database." };
    }

    const roleEntities = newRoles.map(roleName => {
      const userRole = new UserRole();
      userRole.name = roleName;
      return userRole;
    });

    await this.userRoleRepository.save(roleEntities);
    console.log(`Successfully added ${newRoles.length} new roles.`);
    return { message: `Successfully added ${newRoles.length} new roles.` };
  }
}
