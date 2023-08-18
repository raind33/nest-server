import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { LoginGuard } from './login.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Inject(ConfigService)
  private configService: ConfigService;
  @Get()
  getHello(): object {
    return {
      aaa: this.configService.get('aaa'),
    };
  }
  @Get('/api')
  getHello1(): string {
    return '23233';
  }
}
