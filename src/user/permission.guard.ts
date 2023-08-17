import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { UserService } from './user.service';
import { Reflector } from '@nestjs/core';
import { RedisService } from 'src/redis/redis.service';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionGuard implements CanActivate {
  @Inject(UserService)
  private userService: UserService;
  @Inject(Reflector)
  private reflector: Reflector;
  @Inject(RedisService)
  private redisService: RedisService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: any = context.switchToHttp().getRequest();

    const user = request.user;
    if (!user) {
      return true;
    }
    console.log(user);
    let permissions: any = await this.redisService.listGet(
      `user_${user.username}_permissions`,
    );

    if (permissions.length === 0) {
      const roles = await this.userService.findRolesByIds(
        request.user.roles.map((item) => item.id),
      );

      permissions = roles.reduce((total, current) => {
        total.push(...current.permissions.map((item) => item.name));
        return total;
      }, []);
      console.log(permissions, '9999');
      this.redisService.listSet(
        `user_${user.username}_permissions`,
        permissions,
        60 * 30,
      );
    }
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'require-permission',
      [context.getClass(), context.getHandler()],
    );
    console.log(requiredPermissions);
    if (permissions.some((item) => item === requiredPermissions[0])) {
      return true;
    } else {
      throw new UnauthorizedException('没有权限访问该接口');
    }
  }
}
