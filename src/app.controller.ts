import {
  Controller,
  Get,
  Inject,
  UseGuards,
  Headers,
  Post,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseIntPipe,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { LoginGuard } from './login.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync } from 'fs';
const sharp = require('sharp');
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Inject(ConfigService)
  private configService: ConfigService;
  @Get()
  getHello() {
    return this.appService.getHello();
  }
  @Get('/api')
  getHello1(@Headers() headers): string {
    return '23233';
  }
  @Get('/hello')
  getHello2(@Headers() headers): string {
    return 'hello';
  }
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: 'uploads',
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log('file', file);
    return file.path;
  }
  @Get('compression')
  async compression(
    @Query('path') filePath: string,
    @Query('color', ParseIntPipe) color: number,
    @Res() res: any,
    level: number,
  ) {
    if (!existsSync(filePath)) {
      throw new BadRequestException('文件不存在');
    }

    const data = await sharp(filePath, {
      animated: true,
      limitInputPixels: false,
    })
      .gif({
        colours: color,
      })
      .toBuffer();

    res.set('Content-Disposition', `attachment; filename="dest.gif"`);

    res.send(data);
  }
}
