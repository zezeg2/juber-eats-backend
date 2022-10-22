# Juber Eats - uberEats Clone
## Authentication Guard

> NestJS Guard 
> Guard란 executionContext에서 특정 조건에 부합하지 않는(인증, 인가되지 않은) 요청을 차단하는 기능을 한다. 여기서는 현재 실행 컨텍스트에 user 정보가 없다면 controller 혹은 resolver에 Guard가 적용된 메서드에 요청이 매핑될 시 요청을 차단하도록 할 것이다.

### AuthModule

- auth module 및 guard 생성

	- guard: gqlContext에 user 정보가 없다면 (header에 jwtToken이 없을경우 -> 비로그인 상태) 요청을 차단

	```typescript
	@Injectable()
	export class AuthGuard implements CanActivate {
	  /**
	   * @param context : 현재 실행 컨텍스트입니다. 현재 요청 파이프라인에 대한 세부 정보에 대한 액세스를 제공합니다.
	   * @returns : true | false true라면 요청이 정상적으로 진행되고 false라면 요청이 차단된다.
	   */
	    
	  canActivate(
	    context: ExecutionContext,
	  ): boolean | Promise<boolean> | Observable<boolean> {
	    const gqlContext = GqlExecutionContext.create(context).getContext();
	    if (gqlContext['user']) return true;
	    return false;
	  }
	}
	```

	- apply -> `@UseGuard` 데코레이터를 사용하여 guard 적용

		```typescript
		@Query(() => User)
		@UseGuards(AuthGuard)
		me(@Context() context) {
		  if (!context.user) return;
		  return context.user;
		}
		```

### src 구조

├── app.module.ts
├── `auth`
│   ├── `auth.guard.ts`
│   └── `auth.module.ts`
├── common
│   ├── common.module.ts
│   ├── dtos
│   │   └── output.dto.ts
│   └── entities
│       └── core.entity.ts
├── database
│   ├── database.module.ts
│   └── database.providers.ts
├── jwt
│   ├── jwt.constants.ts
│   ├── jwt.interface.ts
│   ├── jwt.middleware.ts
│   ├── jwt.module.ts
│   └── jwt.service.ts
├── main.ts
├── restaurant
│   ├── dtos
│   │   ├── create-restaurant.dto.ts
│   │   └── update-restaurant.dto.ts
│   ├── restaurants.entity.ts
│   ├── restaurants.module.ts
│   ├── restaurants.providers.ts
│   ├── restaurants.resolver.ts
│   └── restaurants.service.ts
└── users
    ├── dtos
    │   ├── create-account.dto.ts
    │   └── login.dto.ts
    ├── entities
    │   └── users.entity.ts
    ├── users.module.ts
    ├── users.providers.ts
    ├── `users.resolver.ts`
    └── users.service.ts
