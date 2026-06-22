import { Candidate } from '../candidate/entities/candidate.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createReadStream } from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import { join } from 'path';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
  ) {}

  private readonly uploadFolder = join(process.cwd(), 'tmp', 'video-uploads');

  async getVideoUrl(filename: string): Promise<string> {
    return join(process.cwd(), 'tmp', 'video-uploads', filename); // Return the path for access
  }

  // Run analysis asynchronously
  async analyzeAndSaveVideo(userId: string, videoPath: string) {
    try {
      const analysisResult = await this.analyzeVideo(videoPath);
      await this.saveUserVideoAnalysis(userId, videoPath, analysisResult);
      console.log('Analysis saved successfully!');
    } catch (error) {
      console.error('Error analyzing and saving video:', error);
    }
  }

  // Send video to external API
  async analyzeVideo(videoPath: string) {
    try {
      const formData = new FormData();
      formData.append('video', createReadStream(videoPath));

      const response = await axios.post(`${process.env.AI_URL}/analyze`, formData, {
        headers: { ...formData.getHeaders() },
      });
      console.log('response.data ', response.data);
      return response.data;
    } catch (error) {
      console.error('Error analyzing video:', error);
      throw error;
    }
  }

  // Save analysis results in the database
  async saveUserVideoAnalysis(userId: string, videoPath: string, analysisResult: any) {
    try {
      const user = await this.candidateRepo.findOne({ where: { id: userId } });

      if (!user) {
        throw new Error('User not found');
      }

      user.videoPath = videoPath;
      user.videoAnalysis = analysisResult;
      console.log("user",user);
      return await this.candidateRepo.save(user);
    } catch (error) {
      console.error('Error saving video analysis to user:', error);
      throw error;
    }
  }

  // Get user video analysis status
  async getUserVideoAnalysis(userId: string) {
    return await this.candidateRepo.findOne({ where: { id: userId }, select: ['videoAnalysis'] });
  }
}
