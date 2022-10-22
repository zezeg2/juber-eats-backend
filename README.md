# Juber Eats - uberEats Clone
## Authentication Middleware

### JwtMiddleware

- request의 header에 jwt 토큰이 있을 경우 이 토큰을 통해 유저를 authentication 하고 실행 컨텍스트의 request에 유저 정보를 저장한다.

	- Middleware를 적용하는 방법은 다음과 같다

		1. `NestMiddleware` 인터페이스를 구현하여 MiddlewareConsumer에 적용
		2. Functional Middleware
			- MiddlewareConsumer에 적용
			- main.ts에 적용하는 방법(global)`app.use(function)`

		위의 방법 중에서 `NestMiddleware`를 구현하여 미들웨어를 작성

		```typescript
		@Injectable()
		export class JwtMiddleware implements NestMiddleware {
		  constructor(
		    private readonly jwtService: JwtService,
		    private readonly usersService: UsersService,
		  ) {}
		  async use(req: any, res: any, next: (error?: any) => void): Promise<any> {
		    if ('x-jwt' in req.headers) {
		      const token = req.headers['x-jwt'];
		      const decoded = this.jwtService.verify(token);
		      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
		        try {
		          const user = await this.usersService.findById(decoded['id']);
		          req['user'] = user;
		        } catch (error) {}
		      }
		    }
		    next();
		  }
		}
		```

		

	- Graphql 모듈의 옵션에서 context옵션을 다음과 같이 설정`context: ({ req }) => ({ user: req['user'] })`

		- graphql 컨텍스트에서 token을 통해 인증된 유저의 정보를 가져올 수 있다

	- AppModule에서 MiddleConsumer에 미들웨어를 등록해준다

		```typescript
		export class AppModule implements NestModule {
		  configure(consumer: MiddlewareConsumer): any {
		    consumer
		      .apply(JwtMiddleware) //.exclude() 를 통해 특정 url에는 middleware를 사용하지 않을 수 있다.
		      .forRoutes({ path: '*', method: RequestMethod.ALL });
		  }
		}
		```

- JwtModule 구조

	```
	├── jwt.interface.ts
	├── jwt.middleware.ts
	├── jwt.module.ts
	└── jwt.service.ts
	```



### src 구조

```
├── `app.module.ts`
├── common
│   ├── common.constants.ts
│   ├── common.module.ts
│   ├── dtos
│   │   └── output.dto.ts
│   └── entities
│       └── core.entity.ts
├── database
│   ├── database.module.ts
│   └── database.providers.ts
├── jwt
│   ├── jwt.interface.ts
│   ├── `jwt.middleware.ts`
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
    ├── users.resolver.ts
    └── users.service.ts
```
