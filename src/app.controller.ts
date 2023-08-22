import { Controller, Get, Inject, UseGuards, Headers } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { LoginGuard } from './login.guard';

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
}
