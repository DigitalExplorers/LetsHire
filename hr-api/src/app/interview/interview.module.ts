import { forwardRef, Module } from "@nestjs/common";
import { InterviewService } from "./interview.service";
import { InterviewController } from "./interview.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Interview } from "./entities/interview.entity"; // Import Interview entity
import { Candidate } from "../candidate/entities/candidate.entity"; // Import User entity
import { Interviewer } from "../interviewer/entities/interviewer.entity"; // Import Interviewer entity
import { CandidateModule } from "../candidate/candidate.module";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { AdminUser } from "../users/entities/users.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Interview, Candidate, Interviewer, AdminUser]), forwardRef(() => CandidateModule),AuthModule, UsersModule],
  providers: [InterviewService],
  controllers: [InterviewController],
  exports: [InterviewService], // Export for usage in other modules
})
export class InterviewModule {}
