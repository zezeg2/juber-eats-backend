/**
 * Guard : Function that choose if thr request go or not
 * Guard 는 각기 다른 기능을 하는 Guard 를 다양하게 만들 수 있는 것이 장점.
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AuthGuard implements CanActivate {
  /**
   * @param context Current execution context. Provides access to details about
   * the current request pipeline.
   * 현재 실행 컨텍스트입니다. 현재 요청 파이프라인에 대한 세부 정보에 대한 액세스를 제공합니다.
   * @returns Value indicating whether or not the current request is allowed to
   * proceed.
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const gqlContext = GqlExecutionContext.create(context).getContext();
    if (gqlContext['user']) return true;
    return false;
  }
}
