import { Body, Controller, Get, Param, Post, Put, Delete, Res, UseInterceptors, UploadedFile, BadRequestException, NotFoundException, Query, UseGuards, Req } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizSeeder } from './quiz.seed';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';


export interface RequestWithUser extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService, private readonly quizSeeder: QuizSeeder, private readonly jwtService: JwtService,) {}

  @UseGuards(JwtAuthGuard)
  @Post('submit-answer')
  async submitAnswer(
    @Body() body: { quizId: number; selectedOptionId: number | null; skipped?: boolean },
    @CurrentUser() currentUser: { userId: number },
  ) {
    return this.quizService.validateUserSelectedAnswer(
      body.quizId,
      body.selectedOptionId,
      currentUser.userId,
      body.skipped ?? false,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('questions')
  async getQuestions(@Req() req: RequestWithUser) {
    return await this.quizService.getQuestions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('questions-by-role-to-app')
  async getQuestionsByRoleToAPP(@Query('roleId') roleId: number, @Query('adminId') adminId: number, @Query('userId') userId: number) {
    return this.quizService.getQuestionsByRoleToAPP(roleId, adminId, userId);
  }

  @Get('getQuestions')
  @UseGuards(JwtAuthGuard)
  async getQuestionsData(@Req() req: RequestWithUser) {
    return await this.quizService.getAllQuestions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('submit-score')
  async submitScore(
    @Body() body: { score: number },
    @CurrentUser() currentUser: { userId: number },
  ) {
    return this.quizService.submitScore(currentUser.userId, body.score);
  }

  @Get('seed')
  @UseGuards(JwtAuthGuard)
  async seed() {
    return this.quizSeeder.seed();
  }


  @UseGuards(JwtAuthGuard)
  @Post('submit-quiz')
  async submitQuiz(
    @Body() body: { answers: Record<number, string> },
    @CurrentUser() currentUser: { userId: number },
  ) {
    return this.quizService.submitQuiz(currentUser.userId, body.answers);
  }

  /** Add a New Question */
  @Post('add-question')
  @UseGuards(JwtAuthGuard)
  async addQuestion(
    @Body() body: { question: string; options: { text: string; isCorrect: boolean }[] }, @Req() req: RequestWithUser, @Query('roleId') roleId?: number
  ) {
    if (roleId === undefined) {
      throw new BadRequestException('roleId is required');
    }

    return await this.quizService.addQuestion(body.question, body.options, req.user.userId, roleId);
  }

  /** Update an Existing Question */
  @Put('questions/:id')
  @UseGuards(JwtAuthGuard)
  async updateQuestion(
    @Param('id') id: number,
    @Body() body: { question: string; options: { id: number; text: string; isCorrect: boolean }[] }, @Req() req: RequestWithUser
  ) {
    return await this.quizService.updateQuestion(id, body.question, body.options, req.user.userId);
  }

  /** Delete a Question */
  @UseGuards(JwtAuthGuard)
  @Delete('questions/:id')
  async deleteQuestion(@Param('id') id: number, @Req() req: RequestWithUser) {
    return await this.quizService.deleteQuestion(id, req.user.userId);
  }

  @Get('/count')
  @UseGuards(JwtAuthGuard)
  async getTotalQuestionsCount(@Req() req: RequestWithUser) {
      return { totalQuestions: await this.quizService.getTotalQuestionsCount(req.user.userId) };
  }

  @UseGuards(JwtAuthGuard)
  @Get('count-by-role')
  async getQuestionCount(@Query('roleId') roleId?: number, @Query('adminId') adminId?: number, @Query('candidatedId') candidatedId?: number) {
    return { totalQuestions: await this.quizService.getQuestionCountByRole(roleId, adminId, candidatedId)};
  }

  @Post('/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(csv|xlsx)$/)) {
                return cb(new BadRequestException('Only CSV or XLSX files are allowed!'), false);
            }
            cb(null, true);
        },
    }),
  )
  async uploadQuestions(@UploadedFile() file: Express.Multer.File, @CurrentUser() adminUser: { userId: number }) {
      if (!file) {
          throw new BadRequestException('No file uploaded!');
      }
      console.log("uploading file");
      return this.quizService.processUploadedFile(file, adminUser.userId);
  }

  @Get("/config")
  @UseGuards(JwtAuthGuard)
  async getQuizConfig(@Query('roleId') roleId: number, @CurrentUser() adminUser: { userId: number}) {
    return await this.quizService.getQuizConfigByRole(roleId, adminUser.userId);
  }

  @Get("/app-quiz-config")
  @UseGuards(JwtAuthGuard)
  async getAppQuizConfig(@Query('roleId') roleId: number, @Query('adminId') adminId?: number) {
    if (adminId === undefined) {
      throw new BadRequestException('adminId is required');
    }

    return await this.quizService.getQuizConfigByRole(roleId, adminId);
  }

  @Put("/config")
  @UseGuards(JwtAuthGuard)
  async updateQuizConfig(@Query('roleId') roleId: number, @Body('numberOfQuestions') numberOfQuestions: number, @Body('timePerQuestionInSeconds') timePerQuestionInSeconds: number, @CurrentUser() adminUser: { userId: number, organizationId:number }) {
    return await this.quizService.updateQuizConfigByRole(roleId, numberOfQuestions, timePerQuestionInSeconds, adminUser.userId, adminUser.organizationId);
  }

  @Post('/upload-with-role')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(csv|xlsx)$/)) {
                return cb(new BadRequestException('Only CSV or XLSX files are allowed!'), false);
            }
            cb(null, true);
        },
    }),
  )
  async uploadQuestionsByRole(@UploadedFile() file: Express.Multer.File, @Body('roleId') roleId: number, @CurrentUser() adminUser: { userId: number }) {
      if (!file) {
          throw new BadRequestException('No file uploaded!');
      }
      console.log("uploading file");
      return this.quizService.processUploadedFileByRole(file, roleId, adminUser.userId);
  }

  /**
   * Get questions by role ID
   */
  @Get('questions-by-role/:roleId')
  async getQuestionsByRole(@Param('roleId') roleId: number, @CurrentUser() adminUser: { userId: number }) {
    const questions = await this.quizService.getQuestionsByRole(roleId, adminUser.userId);
    if (!questions.length) {
      throw new NotFoundException('No questions found for this role.');
    }
    return questions;
  }

  @Get('candidates/:id/:round/attempts')
  async getCandidateQuizAttempts(@Param('id') id: number, @Param('round') round: number) {
    console.log("id,round",id,round);
    return this.quizService.getCandidateAttempts(Number(id), Number(round));
  }

}
