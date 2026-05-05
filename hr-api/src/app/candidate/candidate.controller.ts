import { Controller, Post, Get, Put, Delete, Param, Body, UsePipes, ValidationPipe, NotFoundException, BadRequestException, UseInterceptors, UploadedFiles, Patch, Query, UploadedFile, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CandidateService } from './candidate.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { InterviewService } from '../interview/interview.service';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RegistrationLinkService } from '../registration-link/registration-link.service';


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
    FileFieldsInterceptor([
      { name: 'resume', maxCount: 1 },
      { name: 'idProof', maxCount: 1 },
    ]),
  )
  async createUser(
    @Body() data: CreateCandidateDto,
    @Query('adminId') adminId: string,
    @Query('organizationId') organizationId: string,
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

    // Attach admin ownership from query to user data
    if (adminId) data.adminUser = { id: parseInt(adminId) };

    // Attach organizationId and role from query to user data
    if (organizationId) data.organization = {id: parseInt(organizationId)};

    // Step 1: Create User First
    const createdUser = await this.userService.createUser(data);

    // Step 2: Upload Resume (Mandatory) & ID Proof (Optional)
    console.log('Uploading Files...');

    const resumeFile = files.resume[0];
    const idProofFile = files.idProof?.[0] || null; // Allow `idProof` to be optional

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

  /**
   * Upload Resume & ID Proof separately
   */
  @Post(':userId/upload/documents')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'resume', maxCount: 1 },
      { name: 'idProof', maxCount: 1 },
    ]),
  )
  async uploadDocuments(
    @UploadedFiles()
    files: { resume?: Express.Multer.File[]; idProof?: Express.Multer.File[] },
    @Param('userId') userId: string,
  ) {
    if (!files.resume?.[0] || !files.idProof?.[0]) {
      throw new BadRequestException(
        'Both Resume and ID Proof must be uploaded',
      );
    }

    return this.userService.uploadUserDocuments(
      parseInt(userId),
      files.resume[0],
      files.idProof[0] || null,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId/upload/video')
  @UseInterceptors(FileInterceptor('video')) // Expect a SINGLE file named "video"
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File, // Change to @UploadedFile()
    @Param('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No video file uploaded!');
    }

    console.log(
      `Received video file: ${file.originalname}, Size: ${file.size} bytes`,
    );

    return this.userService.uploadUserVideo(
      parseInt(userId),
      file,
    );
  }

  /**
   * Retrieve User Documents (Resume & ID Proof)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'hr', 'interviewer')
  @Get(':userId/files/documents')
  async getUserDocuments(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: { role?: string; organizationId?: number | null },
  ) {
    const files = await this.userService.getUserDocuments(
      parseInt(userId),
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
    @CurrentUser() currentUser: { role?: string; organizationId?: number | null },
  ) {
    const video = await this.userService.getUserVideos(
      parseInt(userId),
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
    @CurrentUser() adminUser: { userId: number },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
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
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getUserById(@Param('id') id: number, @CurrentUser() adminUser: { userId: number }) {
    const user = await this.userService.getUserById(id, adminUser.userId);
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
  async getUserByIdToConsole(@Param('id') id: number) {
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
  async updateUser(@Param('id') id: number, @Body() data: UpdateCandidateDto, @CurrentUser() adminUser: { userId: number }) {
    return this.userService.updateUser(id, data, adminUser.userId);
  }

  /**
   * Delete user
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Param('id') id: number, @CurrentUser() adminUser: { userId: number }) {
    return this.userService.deleteUser(id, adminUser.userId);
  }

  /**
   * Update user status
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateUserStatus(
    @Param('id') id: number,
    @Body('status') status: string,
    @CurrentUser() adminUser: { userId: number }
  ) {
    return await this.userService.updateUserStatus(id, status, adminUser.userId);
  }

  /**
   * Assign Interviewer
   */
  @Patch(':id/assign-interviewer')
  @UseGuards(JwtAuthGuard)
  async assignInterviewer(
    @Param('id') candidateId: number,
    @Body('interviewerId') interviewerId: number,
    @CurrentUser() adminUser: { userId: number }
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
    @Param('id') candidateId: number,
    @Body('interviewerId') interviewerId: number,
    @Body('date') date: string,
    @CurrentUser() adminUser: { userId: number }
  ) {
    if (!date) throw new BadRequestException('Interview date is required');

    return await this.interviewService.scheduleInterview(candidateId, interviewerId, new Date(date), adminUser.userId);
  }

  /**
   * Get All Candidates with Interviews
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'hr', 'interviewer')
  @Get('/candidates/interviews')
  async getAllCandidatesWithInterviews(
    @CurrentUser() currentUser: { role?: string; organizationId?: number | null },
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
    @Param('id') candidateId: number,
    @CurrentUser() currentUser: { role?: string; organizationId?: number | null },
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
     @CurrentUser() currentUser: { role?: string; organizationId?: number | null },
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
