import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext, OmitType } from '@nestjs/graphql';

export const AuthUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user = gqlContext['user'];
    return user;
  },
);
