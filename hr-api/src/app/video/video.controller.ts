import { Controller, Post, UseInterceptors, UploadedFile, Res, Param, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { VideoService } from './video.service';
import { Response } from 'express';
import { extname } from 'path';
//THIS IS FOR LOCAL VIDEO UPLOADS, BUT CURRENTLY NO USE OF THIS CODE BASE.
@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}
  @Post('upload/:userId')
  @UseInterceptors(FileInterceptor('video', {
    storage: diskStorage({
      destination: 'src/app/video/uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
  }))
  async uploadVideo(@Param('userId') userId: string, @UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = `src/app/video/uploads/${file.filename}`;

    // Return response immediately
    res.status(201).json({
      message: 'Video uploaded successfully!',
      videoPath: filePath,
    });

    // Start video analysis asynchronously
    this.videoService.analyzeAndSaveVideo(userId, filePath);
  }

  @Get('status/:userId')
  // no use we still get this error : driverError: error: column distinctAlias.Candidate_id does not exist Dead code.
  async getAnalysisStatus(@Param('userId') userId: string, @Res() res: Response) {
    try {
      const user = await this.videoService.getUserVideoAnalysis(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' }); 
      }
      return res.json({ videoAnalysis: user.videoAnalysis || null });
    } catch (error) {
      console.error('Error fetching analysis status:', error);
      return res.status(500).json({ message: 'Internal server error' }); 
    }
  }
}
