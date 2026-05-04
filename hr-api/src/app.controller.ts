import { Controller, Get, HttpCode, Response } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { AppService } from './app.service';
import { VideoService } from './app/video/video.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly videoService: VideoService,
  ) {}

  @Get()
  getHello(): Record<string, string> {
    return this.appService.getHello();
  }

  @Get('/health')
  @HttpCode(200)
  public async healthCheck(@Response() res: ExpressResponse): Promise<void> {
    res.status(200).send('OK');
  }
}
