import { Controller, Post, Body, Get, Param, UsePipes, ValidationPipe, NotFoundException, BadRequestException, UseGuards, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InterviewService } from './interview.service';
import { FeedbackDto } from './dto/feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('interviews')
@UseGuards(JwtAuthGuard) // Apply globally if all routes require auth
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}
  
  @Post('/schedule')
  async scheduleInterview(@Body() { candidateId, interviewerId, date }: { candidateId: string, interviewerId: string, date: Date }, @CurrentUser() adminUser: { userId: string }) {
    return await this.interviewService.scheduleInterview(candidateId, interviewerId, date, adminUser.userId);
  }

  // Get all interviews created by this admin
  @Get()
  async getAllInterviews(
    @CurrentUser() adminUser: { userId: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.interviewService.getAllInterviews(
      adminUser.userId,
      page !== undefined ? Number(page) : undefined,
      limit !== undefined ? Number(limit) : undefined,
    );
  }

    // @Get(':id/candidates')
    //     async getCandidatesByInterviewer(@Param('id') id: number) {
    //     return this.interviewService.getCandidatesByInterviewer(id);
    // }

  @Get('interviewer/:id/candidates')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getCandidatesByInterviewer(
    @Param('id') interviewerId: string,
    @CurrentUser()
    currentUser: {
      userId: string;
      email: string;
      role?: string;
      organizationId?: string | null;
    },
  ) {
    return this.interviewService.getCandidatesByInterviewer(interviewerId, currentUser);
  }


    // Submit interview feedback and score
  @Post('feedback/:interviewId')
  async submitFeedback(
    @Param('interviewId') interviewId: number,
    @Body() body: any,
    @CurrentUser() adminUser: { userId: string }
  ) {
    return this.interviewService.submitFeedback(interviewId, body.feedback, body.score, adminUser.userId);
  }

  // Get all interviews for a candidate / interview history
  @Get('candidate/:candidateId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'hr', 'interviewer')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getCandidateInterviews(
    @Param('candidateId') candidateId: string,
    @CurrentUser() currentUser: { role?: string; organizationId?: string | null },
  ) {
    return this.interviewService.getCandidateInterviews(candidateId, currentUser);
  }

  // Move candidate to next round (manager action)
  @Post('promote')
  async promoteCandidate(@Body() body: any, @CurrentUser() adminUser: { userId: string }) {
    const { candidateId, interviewerId, date } = body;
    return this.interviewService.promoteCandidateToNextRound(candidateId, interviewerId, new Date(date), adminUser.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/submit-screening')
  async submitScreening(@Body() screeningData: any) {
    return this.interviewService.submitScreeningRound(screeningData);
  }

  @Post("submit-feedback")
  async submitFeedbackRoundWise(
    @Body() body: { candidateId: string; round: number; feedback: string; score: number },
    @CurrentUser() adminUser: { userId: string }
  ) {
    return this.interviewService.submitInterviewFeedback(body.candidateId, body.round, body.feedback, body.score, adminUser.userId);
  }

  @Post('/feedback')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async addFeedback(@Body() feedbackDto: FeedbackDto, @CurrentUser() adminUser: { userId: string }) {
    console.log('Received Feedback:', feedbackDto);
    console.log('Current Admin User:', adminUser); // Debugging step
    const result = await this.interviewService.addFeedback(feedbackDto, adminUser.userId);
    if (!result) throw new BadRequestException('Could not submit feedback');
    return { message: 'Feedback submitted successfully', result };
  }


}
