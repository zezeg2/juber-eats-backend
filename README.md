# Juber Eats - uberEats Clone

## JWT Dynamic Module

### 1. JwtModule

- 환경변수로부터 동적으로 매개변수를 입력받아 jwt 인증에 사용하는 private키를 provider로 등록하기 위해서 Dynamic Module 등록

	> 정적 모듈은 providers를 인스턴스화(실체화) 하기 때문에 다른 모듈에서 import시 변경할 수 없다
	>
	> 동적모듈은 클래스 호출방식을 사용하고 매개변수를 입력받아 동적으로 providers를 생성할 수 있다. 이 때 static method를 통해 클래스를 호출하게 된다

- nest-cli를 통해 jwt module, service 생성

- JwtModuleOptions 인터페이스를 생성하여 옵션으로 입력받을 필드를 정의한다

	```typescript
	export interface JwtModuleOptions {
	  privateKey: string;
	}
	```

- (선택) provider가 사용할 이름을 constants로 관리하기 위해 common 모듈에 `common.constants.ts` 파일을 생성

	```typescript
	export const CONFIG_OPTIONS = 'CONFIG_OPTIONS';
	```

- forRoot() 스태틱 메서드를 생성하고 options: JwtModuleOptions를 매개변수로 입력받도록 한다

	- `@Global()` 데코레이터를 통해 다른 모듈에서 사용 가능하도록 한다.

	```typescript
	@Global()
	export class JwtModule {
	  static forRoot(options: JwtModuleOptions): DynamicModule {
	    return {
	      module: JwtModule,
	      exports: [JwtService],
	      providers: [
	        {
	          provide: CONFIG_OPTIONS,
	          useValue: options,
	        },
	      ],
	    };
	  }
	}
	```



- JwtService

	- provider에 등록한 `CONFIG_OPTIONS`를 주입한다.

	- { id } 를 payload로 입력받아 jsonwebtoken 패키지를 이용해 sign한다.

		```typescript
		@Injectable()
		export class JwtService {
		  constructor(
		    @Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions,
		  ) {}
		  sign(payload: number): string {
		    return jwt.sign({ payload }, this.options.privateKey);
		  }
		}
		```



### 2. UserModule

- userService

	- JwtService를 생성자를 통해 주입한다

		```typescript
		constructor(
		    @Inject('USERS_REPOSITORY')
		    private readonly usersRepository: Repository<User>,
		    private readonly jwtService: JwtService,
		  ) {}
		```

	- login() 메서드에서 주입된 jwtService를 사용하여 id를 sign하여 token을 발행한다

		```typescript
		async login({ email, password }: LoginInput): Promise<LoginOutput> {
		  // find user with email
		  // check if the password is correct
		  // make a JWT and give it to user
		  try {
		    const user = await this.usersRepository.findOne({ where: { email } });
		    if (!user)
		      return {
		        isOK: false,
		        error: 'Not Found User',
		      };
		    if (!(await user.checkPassword(password)))
		      return {
		        isOK: false,
		        error: 'Wrong Password',
		      };
		    const token = this.jwtService.sign(user.id);
		    return {
		      isOK: true,
		      token,
		    };
		  } catch (error) {}
		}
		```

### src 구조

```
├── app.module.ts
├── common
│   ├── common.constants.ts
│   ├── common.module.ts
│   ├── dtos
│   │   └── output.dto.ts
│   └── entities
│       └── core.entity.ts
├── jwt
│   ├── jwt.interface.ts
│   ├── jwt.module.ts
│   └── jwt.service.ts
├── main.ts
...
└── users
    ├── dtos
    │   ├── create-account.dto.ts
    │   └── login.dto.ts
    ├── entities
    │   └── users.entity.ts
    ├── users.module.ts
    ├── users.providers.ts
    ├── users.resolver.ts
    └── users.service.ts

```

