import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { S3Service } from '../services/s3.service';
import { CandidateNotificationService } from './candidate-notification.service';

type StaffActor = {
  role?: string;
  organizationId?: string | null;
};

@Injectable()
export class CandidateDocumentService {
  private readonly logger = new Logger(CandidateDocumentService.name);

  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    private readonly s3Service: S3Service,
    private readonly candidateNotificationService: CandidateNotificationService,
  ) {}

  private isSuperAdmin(actor: StaffActor) {
    return actor.role === 'superadmin';
  }

  private ensureOrganizationScope(actor: StaffActor) {
    if (this.isSuperAdmin(actor)) {
      return;
    }

    if (!actor.organizationId) {
      throw new NotFoundException('Organization context is required');
    }
  }

  private async getAccessibleCandidate(
    candidateId: string,
    actor: StaffActor,
    relations: string[] = [],
  ) {
    this.ensureOrganizationScope(actor);

    const where: FindOptionsWhere<Candidate> = this.isSuperAdmin(actor)
      ? { id: candidateId }
      : { id: candidateId, organization: { id: actor.organizationId! } };

    const candidate = await this.candidateRepository.findOne({
      where,
      relations,
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found or access denied');
    }

    return candidate;
  }

  private extractCandidateIdFromFileKey(fileKey: string): string {
    let normalized = fileKey.replace(/\\/g, '/');

    if (/^https?:\/\//i.test(normalized)) {
      try {
        normalized = decodeURIComponent(new URL(normalized).pathname);
      } catch {
        normalized = decodeURIComponent(normalized);
      }
    }

    const uploadsMatch = normalized.match(
      /\/uploads\/([0-9a-fA-F-]{36})\/(documents|videos)\//,
    );
    if (uploadsMatch) {
      return uploadsMatch[1];
    }

    const trimmed = normalized.replace(/^\/+/, '');
    const segments = trimmed.split('/');
    if (
      segments.length >= 2 &&
      /^[0-9a-fA-F-]{36}$/.test(segments[0]) &&
      ['documents', 'videos'].includes(segments[1])
    ) {
      return segments[0];
    }

    throw new BadRequestException('Unsupported file key');
  }

  async uploadUserDocuments(
    userId: string,
    resumeFile: Express.Multer.File,
    idProofFile?: Express.Multer.File | null,
  ) {
    const user = await this.candidateRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    if (!resumeFile) {
      throw new BadRequestException('Resume file is required!');
    }

    const resumeUpload = await this.s3Service.uploadFile(
      resumeFile,
      userId,
      'documents',
    );
    user.resume = resumeUpload.fileKey;

    let idProofUrl: string | null = null;
    if (idProofFile) {
      const idProofUpload = await this.s3Service.uploadFile(
        idProofFile,
        userId,
        'documents',
      );
      user.idProof = idProofUpload.fileKey;
      idProofUrl = await this.s3Service.getPreSignedUrl(user.idProof);
    }

    await this.candidateRepository.save(user);

    return {
      message: 'Documents uploaded successfully',
      resumeUrl: await this.s3Service.getPreSignedUrl(user.resume),
      idProofUrl,
    };
  }

  async uploadUserVideo(userId: string, videoFile: Express.Multer.File) {
    const user = await this.candidateRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const videoUpload = await this.s3Service.uploadFile(
      videoFile,
      userId,
      'videos',
    );

    user.videoPath = videoUpload.fileKey;

    const isSecondRound = user.status === 'Shortlisted';

    if (isSecondRound) {
      user.secondRoundFinalized = true;
    } else {
      user.finalized = true;
    }
    user.application_stage = 'video_submitted';
    user.videoSubmittedAt = new Date();
    await this.candidateRepository.save(user);

    void this.candidateNotificationService
      .sendVideoSubmissionConfirmation(user)
      .catch((mailErr: unknown) => {
        this.logger.error(
          `Failed to send video submission email for candidate ${user.id}`,
          mailErr instanceof Error ? mailErr.stack : String(mailErr),
        );
      });

    return {
      message: 'Video uploaded successfully',
    };
  }

  async getUserDocuments(userId: string, actor: StaffActor) {
    await this.getAccessibleCandidate(userId, actor);
    const files = await this.s3Service.listUserFiles(userId.toString(), 'documents');
    return files.map((file: { fileKey: string; preSignedUrl: string }) => ({
      key: file.fileKey,
      url: file.preSignedUrl,
    }));
  }

  async getUserVideos(userId: string, actor: StaffActor) {
    await this.getAccessibleCandidate(userId, actor);
    const files = await this.s3Service.listUserFiles(userId.toString(), 'videos');
    return files.map((file: { fileKey: string; preSignedUrl: string }) => ({
      key: file.fileKey,
      url: file.preSignedUrl,
    }));
  }

  async getPreSignedUrl(
    fileKey: string,
    actor: StaffActor,
    forceDownload = false,
  ) {
    const candidateId = this.extractCandidateIdFromFileKey(fileKey);
    await this.getAccessibleCandidate(candidateId, actor);
    return this.s3Service.getPreSignedUrl(fileKey, forceDownload);
  }
}
