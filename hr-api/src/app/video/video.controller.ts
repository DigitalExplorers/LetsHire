import { Controller, Post, UseInterceptors, UploadedFile, Res, Param, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { VideoService } from './video.service';
import { Response } from 'express';
import { extname } from 'path';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}
  @Post('upload/:userId')
  @UseInterceptors(FileInterceptor('video', {
    storage: diskStorage({
      destination: 'src/app/video/uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
  }))
  async uploadVideo(@Param('userId') userId: number, @UploadedFile() file: Express.Multer.File, @Res() res: Response) {
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
  async getAnalysisStatus(@Param('userId') userId: number, @Res() res: Response) {
    try {
      const user = await this.videoService.getUserVideoAnalysis(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" }); // ✅ Ensure JSON response
      }
      return res.json({ videoAnalysis: user.videoAnalysis || null });
    } catch (error) {
      console.error("Error fetching analysis status:", error);
      return res.status(500).json({ message: "Internal server error" }); // ✅ Ensure JSON response
    }
  }

}
