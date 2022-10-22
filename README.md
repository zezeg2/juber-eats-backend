# Juber Eats - uberEats Clone
## User CRUD

### 1. UserModule

- nest-cli를 통해서 user module 및 service, resolver 생성

- user entity 생성

	```typescript
	enum UserRole {
	  Owner,
	  Client,
	  Delivery,
	}
	
	registerEnumType(UserRole, { name: 'UserRole' });
	
	@InputType({ isAbstract: true })
	@ObjectType()
	@Entity()
	export class User extends CoreEntity {
	  @Column()
	  @Field(() => String)
	  email: string;
	
	  @Column()
	  @Field(() => String)
	  password: string;
	
	  @Column({
	    type: 'enum',
	    enum: UserRole,
	  })
	  @Field(() => UserRole)
	  @IsEnum(UserRole)
	  role: UserRole;
	}
	```

	- role : enum type으로 생성

### user CRUD 기본 요구사항

- response 시 common output을 확장한 형식으로 응답

	```typescript
	@ObjectType()
	export class CoreOutput {
	  @Field(() => Boolean)
	  isOK: boolean;
	  @Field(() => String, { nullable: true })
	  error?: string;
	}
	```

- findByEmail

	- input properties : email
	- output : User

- createAccount

	- input properties: email, password, role

		```typescript
		@InputType()
		export class CreateAccountInput extends PickType(User, [
		  'email',
		  'password',
		  'role',
		]) {}
		```

	- output : 

		```typescript
		@ObjectType()
		export class CreateAccountOutput extends CoreOutput {}
		```

	- execution cases

		- case 1 : email이 중복되는 다른 사용자가 이미 있을경우 fail
		- case 2 : 데이터 베이스 에러 등으로 런타임 에러 발생시 fail
		- case 3 : 위의 경우들이 아닌 경우 success

	- 유저 생성시(Insert) password를 해시화 하여 데이터베이스에 저장하기 위해 `bcrypt` 패키지 설치, 및 user entity에 `hashPassword()`메서드 추가

		```typescript
		...
		import * as bcrypt from 'bcrypt';
		...
		
		// typeorm decorator @BeforeInsert : insert query가 실행되기 전에 데코레이터 해당 데코레이터가 메서드를 실행한다
		@BeforeInsert() 
		async hashPassword(): Promise<void> {
		  try {
		    this.password = await bcrypt.hash(this.password, 10);
		  } catch (error) {
		    console.log(error);
		    throw new InternalServerErrorException();
		  }
		}
		```

- login

- - input properties: email, password

		```typescript
		@InputType()
		export class LoginInput extends PickType(User, ['email', 'password']) {}
		```

	- output :

		```typescript
		@ObjectType()
		export class LoginOutput extends MutationOutput {
		  @Field(() => String, { nullable: true })
		  token?: string;
		}
		```

- - 로그인 시 데이터베이스에 해시화 되어 있는 password를 복호화 하여 대조후 로그인 로직 수행하기 위해 entity에 `checkPassword()`메서드 추가

		```typescript
		async checkPassword(inputPwd: string): Promise<boolean> {
		  try {
		    return await bcrypt.compare(inputPwd, this.password);
		  } catch (error) {
		    throw new InternalServerErrorException();
		  }
		}
		```

	- excution cases

		- case1 : email의 user가 존재하지 않을 경우 fail
		- case2 : email의 user가 존재하지만 checkPassword 결과 password가 일치하지 않을경우 fail
		- case3 : 위의 경우를 제외한 runtime error 발생시 fail
		- case4 : 위의 경우를 제외한 경우 success, jwt 토큰 발행하여 응답

### src 구조 및 수정된 코드

- 설치한 패키지: bcrypt, jsonwebtoken

- src/

	```shell
	├── app.module.ts
	├── common
	│   ├── common.module.ts
	│   ├── dtos
	│   │   └── output.dto.ts
	│   └── entities
	│       └── core.entity.ts
	├── database
	│   ├── database.module.ts
	│   └── database.providers.ts
	├── main.ts
	├── restaurant
	│   ├── dtos
	│   │   ├── create-restaurant.dto.ts
	│   │   └── update-restaurant.dto.ts
	│   ├── restaurants.entity.ts
	│   ├── restaurants.module.ts
	│   ├── restaurants.providers.ts
	│   ├── restaurants.resolver.ts
	│   └── restaurants.service.ts
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

- users.service.ts

	```typescript
	import { Inject, Injectable } from '@nestjs/common';
	import { Repository } from 'typeorm';
	import { User } from './entities/users.entity';
	import {
	  CreateAccountInput,
	  CreateAccountOutput,
	} from './dtos/create-account.dto';
	import { LoginInput, LoginOutput } from './dtos/login.dto';
	import * as jwt from 'jsonwebtoken';
	import { ConfigService } from '@nestjs/config';
	
	@Injectable()
	export class UsersService {
	  constructor(
	    @Inject('USERS_REPOSITORY')
	    private readonly usersRepository: Repository<User>,
	    private readonly configService: ConfigService,
	  ) {}
	  async createAccount({
	    email,
	    password,
	    role,
	  }: CreateAccountInput): Promise<CreateAccountOutput> {
	    // check new user & create user
	    try {
	      if (await this.usersRepository.findOne({ where: { email } })) {
	        return {
	          isOK: false,
	          error: 'There is a user with that email already',
	        };
	      }
	      await this.usersRepository.save(
	        this.usersRepository.create({ email, password, role }),
	      );
	      return { isOK: true };
	    } catch (e) {
	      return { isOK: false, error: "Couldn't create account" };
	    }
	    // hash the password
	  }
	
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
	      const token = jwt.sign(
	        { id: user.id },
	        this.configService.get('SECRET_KEY'),
	      );
	      return {
	        isOK: true,
	        token,
	      };
	    } catch (error) {}
	  }
	
	  async findOne(email: string): Promise<User> {
	    const exists = await this.usersRepository.findOne({ where: { email } });
	    console.log(exists);
	    return exists;
	  }
	}
	```

- users.resolver.ts

	```typescript
	import { User } from './entities/users.entity';
	import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
	import { UsersService } from './users.service';
	import {
	  CreateAccountInput,
	  CreateAccountOutput,
	} from './dtos/create-account.dto';
	import { LoginInput, LoginOutput } from './dtos/login.dto';
	import { InternalServerErrorException } from '@nestjs/common';
	
	@Resolver(() => User)
	export class UsersResolver {
	  constructor(private readonly usersService: UsersService) {}
	
	  @Query(() => User)
	  async findOne(@Args('email') email: string): Promise<User> {
	    return await this.usersService.findOne(email);
	  }
	
	  @Mutation(() => CreateAccountOutput)
	  async createAccount(
	    @Args('input') createAccountInput: CreateAccountInput,
	  ): Promise<CreateAccountOutput> {
	    try {
	      return await this.usersService.createAccount(createAccountInput);
	    } catch (error) {
	      return {
	        isOK: false,
	        error: error,
	      };
	    }
	  }
	
	  @Mutation(() => LoginOutput)
	  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
	    try {
	      return await this.usersService.login(loginInput);
	    } catch (error) {
	      throw new InternalServerErrorException();
	    }
	  }
	}
	```
