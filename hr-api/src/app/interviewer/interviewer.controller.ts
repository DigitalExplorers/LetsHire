import { Controller, Post, Get, Put, Delete, Param, Query, Body, Patch, UseGuards } from '@nestjs/common';
import { InterviewerService } from './interviewer.service';
import { CreateInterviewerDto } from './dto/create-interviewer.dto';
import { UpdateInterviewerDto } from './dto/update-interviewer.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('interviewers')
@UseGuards(JwtAuthGuard)
export class InterviewerController {
  constructor(private readonly interviewerService: InterviewerService) {}

  // Create a new interviewer
  @Post()
  async createInterviewer(@Body() dto: CreateInterviewerDto) {
    return this.interviewerService.createInterviewer(dto);
  }

  // Get all interviewers in the same organization (with optional skill filter)
  @Get()
  async getInterviewers(
    @CurrentUser() adminUser: { userId: number; organizationId: number },
    @Query('skills') skills?: string
  ) {
    const skillsArray = skills ? skills.split(',') : undefined;
    return this.interviewerService.getInterviewers(adminUser.organizationId, skillsArray);
  }

  // Get a single interviewer by ID
  @Get(':id')
  async getInterviewerById(@Param('id') id: number) {
    return this.interviewerService.getInterviewerById(id);
  }

  // Update interviewer details with adminId check
  @Put(':id')
  async updateInterviewer(
    @Param('id') id: number,
    @Body() updateDto: UpdateInterviewerDto,
    @CurrentUser() adminUser: { userId: number }
  ) {
    return this.interviewerService.updateInterviewer(id, updateDto, adminUser.userId);
  }

  // Delete an interviewer
  @Delete(':id')
  async deleteInterviewer(
    @Param('id') id: number,
    @CurrentUser() adminUser: { userId: number }
  ) {
    return this.interviewerService.deleteInterviewer(id, adminUser.userId);
  }


  @Get()
  async getInterviewersWithCandidates(@Query('includeCandidates') includeCandidates?: string) {
    const include = includeCandidates === 'true';
    return this.interviewerService.getInterviewersWithCandidates(include);
  }

  @Patch(':id/add-candidate')
  async addCandidateToInterviewer(
    @Param('id') interviewerId: number,
    @Body('candidateId') candidateId: number
  ) {
    return this.interviewerService.assignCandidate(interviewerId, candidateId);
  }



}
