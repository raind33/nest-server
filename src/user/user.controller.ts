import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  Res,
  Query,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { randomUUID } from 'crypto';
import * as qrcode from 'qrcode';
import { RedisService } from 'src/redis/redis.service';

interface QrCodeInfo {
  status:
    | 'noscan'
    | 'scan-wait-confirm'
    | 'scan-confirm'
    | 'scan-cancel'
    | 'expired';
  userInfo?: {
    userId: number;
  };
}
// noscan 未扫描
// scan-wait-confirm -已扫描，等待用户确认
// scan-confirm 已扫描，用户同意授权
// scan-cancel 已扫描，用户取消授权
// expired 已过期
@Controller('user')
export class UserController {
  @Inject(JwtService)
  private readonly jwtService: JwtService;
  @Inject(RedisService)
  private redisService: RedisService;
  constructor(private readonly userService: UserService) {}

  @Post('login')
  async login(@Body() user: LoginDto, @Res({ passthrough: true }) res: any) {
    const foundUser = await this.userService.login(user);
    if (foundUser) {
      const access_token = this.jwtService.sign(
        {
          user: {
            id: foundUser.id,
            roles: foundUser.roles,
            username: foundUser.username,
          },
        },
        {
          expiresIn: '30m',
        },
      );

      const refresh_token = this.jwtService.sign(
        {
          user: {
            id: foundUser.id,
          },
        },
        {
          expiresIn: '7d',
        },
      );

      return {
        access_token,
        refresh_token,
      };
    } else {
      return 'login fail';
    }
  }

  @Post('register')
  register(@Body() user: RegisterDto) {
    return this.userService.register(user);
  }
  @Get('refresh')
  async refresh(@Query('refresh_token') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken);

      const user = await this.userService.findUserById(data.user.id);

      const access_token = this.jwtService.sign(
        {
          userId: user.id,
          username: user.username,
        },
        {
          expiresIn: '30m',
        },
      );

      const refresh_token = this.jwtService.sign(
        {
          userId: user.id,
        },
        {
          expiresIn: '7d',
        },
      );

      return {
        access_token,
        refresh_token,
      };
    } catch (e) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }

  @Get('qrcode/generate')
  async generate() {
    const uuid = randomUUID();
    const dataUrl = await qrcode.toDataURL(
      `http://172.20.0.142:3000/pages/confirm.html?id=${uuid}`,
    );
    this.redisService.set(
      `qrcode_${uuid}`,
      JSON.stringify({
        status: 'noscan',
      }),
    );
    return {
      qrcode_id: uuid,
      img: dataUrl,
    };
  }
  @Get('qrcode/check')
  async check(@Query('id') id: string) {
    return this.redisService.get(`qrcode_${id}`);
  }

  @Get('qrcode/scan')
  async scan(@Query('id') id: string) {
    const res = await this.redisService.get(`qrcode_${id}`);
    const info = JSON.parse(res);
    if (!info) {
      throw new BadRequestException('二维码已过期');
    }
    info.status = 'scan-wait-confirm';
    this.redisService.set(`qrcode_${id}`, JSON.stringify(info));
    return 'success';
  }

  @Get('qrcode/confirm')
  async confirm(@Query('id') id: string) {
    const res = await this.redisService.get(`qrcode_${id}`);
    const info = JSON.parse(res);
    if (!info) {
      throw new BadRequestException('二维码已过期');
    }
    info.status = 'scan-confirm';
    this.redisService.set(`qrcode_${id}`, JSON.stringify(info));
    return 'success';
  }

  @Get('qrcode/cancel')
  async cancel(@Query('id') id: string) {
    const res = await this.redisService.get(`qrcode_${id}`);
    const info = JSON.parse(res);
    if (!info) {
      throw new BadRequestException('二维码已过期');
    }
    info.status = 'scan-cancel';
    this.redisService.set(`qrcode_${id}`, JSON.stringify(info));
    return 'success';
  }

  @Get('init')
  init() {
    return this.userService.initData();
  }
}
