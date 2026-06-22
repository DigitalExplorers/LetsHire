import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Upload } from '@aws-sdk/lib-storage';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class S3Service {
  private s3: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    // Credentials are intentionally omitted so the AWS SDK uses its default
    // provider chain (IAM role in deployed environments; AWS_PROFILE locally).
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || 'ap-south-1',
      maxAttempts: 3,
    });
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || '';
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  /** Returns true when a fileKey is a local absolute path (saved as S3 fallback) */
  private isLocalPath(fileKey: string): boolean {
    return path.isAbsolute(fileKey);
  }

  /** Returns true when a value is an HTTP(S) URL */
  private isHttpUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  /** Builds local static URL from a relative uploads path */
  private buildLocalAssetUrl(relativePath: string): string {
    const port = this.configService.get<string>('PORT') || '4000';
    return `http://localhost:${port}/org-assets/${relativePath
      .replace(/^\/+/, '')
      .replace(/\\/g, '/')}`;
  }

  /** Converts a local absolute path to a serveable local static URL */
  private localPathToUrl(localPath: string): string {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const relativePath = localPath.startsWith(uploadsDir)
      ? localPath.slice(uploadsDir.length)
      : localPath;
    return this.buildLocalAssetUrl(relativePath);
  }

  /**
   * Upload file — tries S3 first, falls back to local filesystem if S3 fails
   */
  async uploadFile(
    file: Express.Multer.File | undefined,
    userId: string,
    fileType: 'documents' | 'videos'
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for upload!');
    }
    const fileKey = `${userId}/${fileType}/${uuidv4()}-${file.originalname}`;

    try {
      const upload = new Upload({
        client: this.s3,
        params: {
          Bucket: this.bucketName,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        },
        queueSize: 4,            // Concurrent uploads
        partSize: 5 * 1024 * 1024, // 5MB chunks
        leavePartsOnError: false,
      });

      await upload.done();

      return { fileKey };
    } catch (error) {
      console.warn(
        'S3 upload failed, falling back to local filesystem:',
        this.getErrorMessage(error),
      );
      const uploadDir = path.join(process.cwd(), 'uploads', userId, fileType);
      fs.mkdirSync(uploadDir, { recursive: true });
      const localFilePath = path.join(uploadDir, `${uuidv4()}-${file.originalname}`);
      fs.writeFileSync(localFilePath, file.buffer);
      return { fileKey: localFilePath };
    }
  }

  /**
   * Upload a public asset (org logo / background) — tries S3 first, falls back to local if S3 fails.
   * Returns the S3 key (not a public URL) so callers can generate pre-signed URLs on fetch.
   */
  async uploadPublicAsset(
    file: Express.Multer.File | undefined,
    orgName: string,
    type: 'logos' | 'backgrounds'
  ): Promise<{ fileKey: string }> {
    if (!file) {
      throw new BadRequestException('No file provided for upload!');
    }

    const sanitizedOrgName = orgName.replace(/\s+/g, '-').toLowerCase();
    const sanitizedFilename = file.originalname
    .replace(/\s+/g, '-') // replace spaces with dashes
    .replace(/[^a-zA-Z0-9.-]/g, '');

    const uniqueFilename = `${uuidv4()}-${sanitizedFilename}`;
    const fileKey = `organizations/${sanitizedOrgName}/${type}/${uniqueFilename}`;

    try {
      const upload = new Upload({
        client: this.s3,
        params: {
          Bucket: this.bucketName,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        },
      });

      await upload.done();

      return { fileKey };
    } catch (error) {
      console.warn(
        'S3 public asset upload failed, falling back to local filesystem:',
        this.getErrorMessage(error),
      );
      const uploadDir = path.join(
        process.cwd(),
        'uploads',
        'organizations',
        sanitizedOrgName,
        type,
      );
      fs.mkdirSync(uploadDir, { recursive: true });
      const localFilePath = path.join(uploadDir, uniqueFilename);
      fs.writeFileSync(localFilePath, file.buffer);
      return { fileKey: localFilePath };
    }
  }

  /**
   * Extract the S3 object key from a full S3 URL.
   * Handles legacy records that stored the full URL instead of just the key.
   * e.g. "https://bucket.s3.region.amazonaws.com/org/logo.jpg" → "org/logo.jpg"
   */
  private extractS3Key(urlOrKey: string): string {
    let key = urlOrKey;
    if (urlOrKey.startsWith('https://') && urlOrKey.includes('.amazonaws.com/')) {
      key = urlOrKey.split('.amazonaws.com/')[1];
    }
    // Strip query string — handles presigned URLs stored in DB before the fileKey migration
    return key.split('?')[0];
  }

  /**
   * Generate Pre-Signed URL for a private file.
   * If fileKey is a local absolute path (S3 was unavailable at upload time), returns a local URL instead.
   * Also handles legacy records where a full S3 URL was stored instead of just the key.
   */
  async getPreSignedUrl(fileKey: string, forceDownload = false): Promise<string> {
    if (!fileKey) {
      throw new BadRequestException('File key is required');
    }

    if (this.isLocalPath(fileKey)) {
      return this.localPathToUrl(fileKey);
    }

    // Legacy/local values that were persisted as served URLs should be returned directly
    if (this.isHttpUrl(fileKey) && !fileKey.includes('.amazonaws.com/')) {
      return fileKey;
    }

    // Legacy/local values that were persisted as relative static paths
    if (fileKey.startsWith('/org-assets/') || fileKey.startsWith('/uploads/')) {
      return this.buildLocalAssetUrl(fileKey.replace(/^\/(org-assets|uploads)\//, ''));
    }

    fileKey = this.extractS3Key(fileKey);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        ...(forceDownload && {
          ResponseContentDisposition: `attachment; filename="${fileKey.split("/").pop()}"`,
        }),
      });

      return await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    } catch (error) {
      console.error('Error generating pre-signed URL:', error);
      throw new InternalServerErrorException('Error generating pre-signed URL');
    }
  }

  /**
   * List User Files & Return URLs.
   * Tries S3 first; falls back to local filesystem if S3 is unavailable.
   */
  async listUserFiles(userId: string, fileType: 'documents' | 'videos') {
    try {
      const { Contents } = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: `${userId}/${fileType}/`,
        }),
      );

      if (!Contents || Contents.length === 0) {
        throw new NotFoundException(`No ${fileType} found for user ${userId}`);
      }

      return await Promise.all(
        Contents.map(async (file) => {
          if (!file.Key) {
            throw new NotFoundException('S3 object key missing');
          }

          return {
            fileKey: file.Key,
            preSignedUrl: await this.getPreSignedUrl(file.Key),
          };
        })
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      console.warn(
        `S3 listing failed for user ${userId}, falling back to local filesystem:`,
        this.getErrorMessage(error),
      );
      const uploadsDir = path.join(process.cwd(), 'uploads', userId, fileType);
      if (!fs.existsSync(uploadsDir)) return [];
      return fs.readdirSync(uploadsDir).map((filename) => {
        const localPath = path.join(uploadsDir, filename);
        return { fileKey: localPath, preSignedUrl: this.localPathToUrl(localPath) };
      });
    }
  }
}
