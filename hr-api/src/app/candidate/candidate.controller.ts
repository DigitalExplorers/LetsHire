import { Controller, Post, Get, Put, Delete, Param, Body, UsePipes, ValidationPipe, NotFoundException, ForbiddenException ,BadRequestException, UseInterceptors, UploadedFiles, Patch, Query, UploadedFile, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CandidateService } from './candidate.service';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { InterviewService } from '../interview/interview.service';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RegistrationLinkService } from '../registration-link/registration-link.service';
import { CreateCandidateRequestDto } from './dto/Create-candidate-request.dto';


@Controller('candidates')
export class CandidateController {
  constructor(
    private readonly userService: CandidateService,
    private readonly interviewService: InterviewService,
    private readonly jwtService: JwtService,
    private readonly registrationLinkService: RegistrationLinkService,
  ) {}
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'resume', maxCount: 1 },
        { name: 'idProof', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB
        },
        fileFilter: (req, file, cb) => {
        if (file.fieldname === 'resume') {
          const allowedMimeTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/octet-stream',
          ];

          const validMime = allowedMimeTypes.includes(file.mimetype);
          const validExt = /\.(pdf|docx)$/i.test(file.originalname);

          if (!validMime && !validExt) {
            return cb(
              new BadRequestException('Resume must be PDF or DOCX only'),
              false,
            );
          }
        }

        cb(null, true);
      }
      },
    ),
  )
  async createUser(
    @Body() data: CreateCandidateRequestDto,
    @UploadedFiles() files: { resume?: Express.Multer.File[], idProof?: Express.Multer.File[] }
  ) {
    console.log('Received Form Data:', data);
    console.log('Received Files:', files);

    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestException('Empty request body received');
    }

    if (!files.resume || files.resume.length === 0) {
      throw new BadRequestException('Resume file is required!');
    }
     // Attach admin ownership from body to user data
    if (data.adminId) {  data.adminUser = { id: data.adminId }; }
    // Attach organizationId from body to user data
    if (data.organizationId) { data.organization = { id: data.organizationId, };}
   
    // Step 1: Create User First
    const createdUser = await this.userService.createUser(data);

    // Step 2: Upload Resume (Mandatory) & ID Proof (Optional)
    console.log('Uploading Files...');

   const resumeFile = files.resume?.[0];
    const idProofFile = files.idProof?.[0] || null;

    if (!resumeFile) {
      throw new BadRequestException('Resume file is required!');
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Resume must be less than 5MB');
    }

    await this.userService.uploadUserDocuments(
      createdUser.id,
      resumeFile, // Required
      idProofFile, // Optional
    );

    const payload = { email: createdUser.email, sub: createdUser.id };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'User created successfully',
      userId: createdUser.id,
      access_token: accessToken,
    };
  }


  @UseGuards(JwtAuthGuard)
  @Post('upload/video')
 @UseInterceptors(
    FileInterceptor('video', {
      limits: {
        fileSize: 150 * 1024 * 1024, // 150MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'video/mp4',
          'video/webm',
          'video/quicktime',
          'application/octet-stream',
        ];

        const validMime = allowedMimeTypes.includes(file.mimetype);
        const validExt = /\.(mp4|webm|mov)$/i.test(file.originalname);

        if (!validMime && !validExt) {
          return cb(
            new BadRequestException(
              'Only MP4, WEBM, or MOV videos are allowed',
            ),
            false,
          );
        }

        cb(null, true);
      }
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
    @CurrentUser() currentUser: { userId: string },
  ) {
    if (!file) {
      throw new BadRequestException('No video file uploaded!');
    }

    if (currentUser.userId !== userId) {
      throw new ForbiddenException('You can only upload your own video');
    }

    console.log(
      `Received video file: ${file.originalname}, Size: ${file.size} bytes`,
    );

    return this.userService.uploadUserVideo(userId, file);
  }

  /**
   * Retrieve User Documents (Resume & ID Proof)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'hr', 'interviewer')
  @Get(':userId/files/documents')
  async getUserDocuments(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: { role?: string; organizationId?: string | null },
  ) {
    const files = await this.userService.getUserDocuments(
      userId,
      currentUser,
    );
    return { message: 'Documents retrieved successfully', files };
  }

  /**
   * Retrieve User Video
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'hr', 'interviewer')
  @Get(':userId/files/video')
  async getUserVideo(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: { role?: string; organizationId?: string | null },
  ) {
    const video = await this.userService.getUserVideos(
      userId,
      currentUser,
    );
    return { message: 'Video retrieved successfully', video };
  }

  /**
   * Verify OTP
   */
  @UseGuards(JwtAuthGuard)
  @Post('/verify-otp')
  async verifyOtp(@Body() body: { id: string; otp: string }) {
    return this.userService.verifyOtp(body.id, body.otp);
  }

  /**
   * Retrieve all users
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getUsers(
    @CurrentUser() adminUser: { userId: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    console.log("THIS END POINT IS INVOKED")
    return this.userService.getUsers(
      adminUser.userId,
      page !== undefined ? Number(page) : undefined,
      limit !== undefined ? Number(limit) : undefined,
    );
  }

  /**
   * Check if email exists
   */
  @Get('check-email')
  async checkEmail(@Query('email') email: string, @Query('token') token: string) {
      if (!token) {
          throw new UnauthorizedException('Registration token is required');
      }

      const resolvedLink = await this.registrationLinkService.resolveToken(token);
      const normalizedEmail = email.toLowerCase();
      const user = await this.userService.findUserByEmail(normalizedEmail, resolvedLink.adminId);

      if (!user) return { exists: false, message: "Email is available" };

      if (user.finalized && user.status === 'Shortlisted') {
          if (user.secondRoundFinalized) {
              return {
                  exists: true,
                  message: "You have already completed both rounds. Thank you!"
              };
          }
          return { exists: false, message: "You are shortlisted! Please continue to the second round." };
      }
      else if (user.finalized) {
          return { exists: true, message: "You have already completed registration." };
      }else{
        return { exists: false, message: `You have ${user.attempt_number} registration attempts. You can continue.` };
      }
  }

  /**
   * Get user by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'hr', 'interviewer')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getUserById(
    @Param('id') id: string,
    @CurrentUser() currentUser: { role?: string; organizationId?: string | null },
  ) {
    const user = await this.userService.getCandidateDetails(id, currentUser);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Get user by ID
   */
  @UseGuards(JwtAuthGuard)
  @Get('/candidate/:id')
  async getUserByIdToConsole(@Param('id') id: string) {
    const user = await this.userService.getUserByIdToAPP(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return {id:user.id, firstName:user.firstName, desiredRole:user.desiredRole};
  }

  /**
   * Update user details
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateUser(@Param('id') id: string, @Body() data: UpdateCandidateDto, @CurrentUser() adminUser: { userId: string }) {
    return this.userService.updateUser(id, data, adminUser.userId);
  }

  /**
   * Delete user
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Param('id') id: string, @CurrentUser() adminUser: { userId: string }) {
    return this.userService.deleteUser(id, adminUser.userId);
  }

  /**
   * Update user status
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'hr', 'interviewer')
  async updateUserStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() currentUser: { userId :string; role?: string; organizationId?: string | null },
  ) {
    return await this.userService.updateUserStatusByActor(id, status, currentUser);
  }

  /**
   * Assign Interviewer
   */
  @Patch(':id/assign-interviewer')
  @UseGuards(JwtAuthGuard)
  async assignInterviewer(
    @Param('id') candidateId: string,
    @Body('interviewerId') interviewerId: string,
    @CurrentUser() adminUser: { userId: string }
  ) {
    if (!candidateId || !interviewerId) {
      throw new BadRequestException(
        'Candidate ID and Interviewer ID are required',
      );
    }

    return await this.userService.assignInterviewer(candidateId, interviewerId, adminUser.userId);
  }

  /**
   * Schedule Interview
   */
  @Patch(':id/schedule-interview')
  @UseGuards(JwtAuthGuard)
  async scheduleInterview(
    @Param('id') candidateId: string,
    @Body('interviewerId') interviewerId: string,
    @Body('date') date: string,
    @CurrentUser() adminUser: { userId: string }
  ) {
    if (!date) throw new BadRequestException('Interview date is required');

    return await this.interviewService.scheduleInterview(candidateId, interviewerId, new Date(date), adminUser.userId);
  }

  /**
   * Get All Candidates with Interviews.  end point is existing but we are not using it. tested with postan working fine
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'hr', 'interviewer')
  @Get('/candidates/interviews')
  async getAllCandidatesWithInterviews(
    @CurrentUser() currentUser: { role?: string; organizationId?: string | null },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.userService.getAllCandidatesWithInterviews(
      currentUser,
      page !== undefined ? Number(page) : undefined,
      limit !== undefined ? Number(limit) : undefined,
    );
  }

  /**
   * Get Candidate Details with Interview
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'hr', 'interviewer')
  @Get('/candidates/:id')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getCandidateDetails(
    @Param('id') candidateId: string,
    @CurrentUser() currentUser: { role?: string; organizationId?: string | null },
  ) {
    return await this.userService.getCandidateDetails(candidateId, currentUser);
  }

   /**
   * Get Pre-Signed URL for a Specific File
   */
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('superadmin', 'admin', 'hr', 'interviewer')
   @Get('/preSignedUrl/:fileKey')
   @Throttle({ default: { limit: 60, ttl: 60000 } })
   async getPreSignedUrl(
     @Param('fileKey') fileKey: string,
     @CurrentUser() currentUser: { role?: string; organizationId?: string | null },
     @Query("download") download?: boolean,
   ) {
     const decodedFileKey = decodeURIComponent(fileKey); // Decode special characters
     const preSignedUrl = await this.userService.getPreSignedUrl(
       decodedFileKey,
       currentUser,
       download,
     );
     return { url: preSignedUrl };
   }
 

}
