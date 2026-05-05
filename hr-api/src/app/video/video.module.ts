import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { CandidateModule } from '../candidate/candidate.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from '../candidate/entities/candidate.entity';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/videos',
    }),
    TypeOrmModule.forFeature([Candidate]), // Register User entity for database access
    CandidateModule, // Import CandidateModule to use UserRepository in VideoService
  ],
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}
