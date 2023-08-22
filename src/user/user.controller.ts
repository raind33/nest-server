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
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('user')
export class UserController {
  @Inject(JwtService)
  private readonly jwtService: JwtService;
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

  @Get('init')
  init() {
    return this.userService.initData();
  }
}
