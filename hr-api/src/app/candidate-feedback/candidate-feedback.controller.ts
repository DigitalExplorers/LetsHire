import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { CandidateFeedbackService } from './candidate-feedback.service';
import { FeedbackDto } from './dto/feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin', 'hr', 'interviewer')
export class CandidateFeedbackController {
  constructor(private readonly feedbackService: CandidateFeedbackService) {}

  @Post(':candidateId')
  async addFeedback(
    @Param('candidateId') candidateId: string,
    @CurrentUser() currentUser: { userId: string },
    @Body() feedbackDto: FeedbackDto,
  ) {
    return this.feedbackService.addFeedback(candidateId, currentUser.userId, feedbackDto);
  }

  @Get(':candidateId')
  async getFeedbacks(@Param('candidateId') candidateId: string) {
    return this.feedbackService.getFeedbacks(candidateId);
  }
}
