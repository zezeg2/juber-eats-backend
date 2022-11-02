/**
 * Guard : Function that choose if thr request go or not
 * Guard 는 각기 다른 기능을 하는 Guard 를 다양하게 만들 수 있는 것이 장점.
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { AllowedRoles } from './role.decorator';
import { JwtService } from '../jwt/jwt.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
  /**
   * @param context Current execution context. Provides access to details about
   * the current request pipeline.
   * 현재 실행 컨텍스트입니다. 현재 요청 파이프라인에 대한 세부 정보에 대한 액세스를 제공합니다.
   * @returns Value indicating whether or not the current request is allowed to
   * proceed.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );
    if (!roles) return true;
    let user;
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext.req
      ? gqlContext.req.headers['x-jwt']
      : gqlContext.token;
    const decoded = this.jwtService.verify(token);
    try {
      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        user = await this.usersService.findById(decoded['id']);
      }
    } catch (error) {
      return false;
    }
    if (!user) return false;
    if (roles.includes('Any')) return true;
    return roles.includes(user.role);
  }
}
