# Juber Eats - uberEats Clone
### 1. Setup NestJS Backend

- Node LTS 버전 사용 (22.10.10 - v16.17.1)

	```shell
	npm i -g @nestjs/cli // nestjs-cli 글로벌 설치
	```

- nest-cli를 통해 NestJS 프로젝트 생성

	```shell
	nest new project-name
	```

- 생성된 프로젝트의 루트 디렉터리에서 `npm install` 명령어로 패키지 및 종속성 설치

### 2. Apollo Server Setup

- 패키지 설치

	``` shell
	npm install @nestjs/graphql @nestjs/apollo graphql apollo-server-express     
	```

- AppModule에 `GraphQLModule`을 추가해주고 필요에 따른 옵션을 지정해준다.

	``` javascript
	GraphQLModule.forRoot<ApolloDriverConfig>({
	  driver: ApolloDriver,
	  autoSchemaFile: true, // true로 설정시 스키마파일을 메모리에 로드, Code First
	  // 스키마 파일을 소스프로젝트 폴더에 저장시 아래와 같이 설정
	  // autoSchemaFile: join(process.cwd(), 'src/schema.gql'), 
	  debug: false, // default false
	  playground: true, // default true, /graphql로 접속시 graphql 콘솔 활성화/ 비활성화
	  // typePaths: ['./**/*.graphql'], Schema First
	})
	```

- graphql파일을 작성하지 않고(Code First) 데코레이터를 이용하여 ObjectType, Resolver(Query, Mutation)을 작성한다 (Apollo Server를 실행하기 위해서는 Schema, Resolver를 생성해야한다)

	> CodeFirst 접근방식에서 Schema를 생성하기 위해서는 Resolver가 있어야 한다

	

### 3. TypeORM Configuration

- 패키지 설치 

	```shell
	npm install typeorm pg cross-env @nestjs/config Joi
	```

	- typeorm -> Data-Mapper ORM for TypeScript, ES7, ES6, ES5. Supports MySQL, PostgreSQL ...
	- @nestjs/typeorm -> 이 패키지는 nestjs 전용 typeORM 패키지로, 사용하기 더 용이하다
	- pg -> postgresql driver
	- cross-env -> Run scripts that set and use environment variables across platforms
	- @nestjs/config -> Configuration module for [Nest](https://github.com/nestjs/nest) based on the [dotenv](https://github.com/motdotla/dotenv)
	- Joi -> Object schema validation

- typeorm 패키지를 이용하여 데이터베이스 모듈을 생성하는 방식 사용 (더 간단하게 @nestjs/typeorm 패키지 사용 가능 https://docs.nestjs.com/techniques/database)

- 데이터베이스 모듈 생성 `nest g module databases`

- providers 생성

	```typescript
	export const databaseProviders = [
	  {
	    provide: 'DATA_SOURCE',
	    useFactory: async () => {
	      const dataSource = new DataSource({
	        type: 'postgres',
	        host: process.env.DB_HOST,
	        port: +process.env.DB_PORT,
	        username: process.env.DB_USERNAME,
	        password: process.env.DB_PASSWORD,
	        database: process.env.DB_NAME,
	        logging: process.env.NODE_ENV !== 'production',
	        synchronize: process.env.NODE_ENV !== 'production',
	        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
	      });
	
	      return dataSource.initialize();
	    },
	  },
	];
	
	```

	``` typescript
	@Module({
	  providers: [...databaseProviders],
	  exports: [...databaseProviders],
	})
	export class DatabaseModule {}
	```

	- 여기서 애플리케이션 실행 환경(production, developing, testing)에 따라 다른 환경변수를 사용하기 위해서 세가지 패키지를 사용하게 된다

		1. @nestjs/config
		2. cross-env
		3. joi

	- 프로젝트의 root dir 아래에 `.env.*` 형식으로 환경변수 파일 생성 ex).env.dev

		```
		DB_HOST=localhost
		DB_PORT=5432
		DB_USERNAME=jonghyeon
		DB_PASSWORD=password
		DB_NAME=juber-eats
		```

	- AppModule에 ConfigModule을 추가한다

		```typescript
		ConfigModule.forRoot({
		  isGlobal: true,
		  envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
		  ignoreEnvFile: process.env.NODE_ENV === 'prod',
		  validationSchema: Joi.object({
		    NODE_ENV: Joi.string().valid('dev', 'test', 'prod').required(),
		    DB_HOST: Joi.string().required(),
		    DB_PORT: Joi.string().required(),
		    DB_USERNAME: Joi.string().required(),
		    DB_PASSWORD: Joi.string().required(),
		    DB_NAME: Joi.string().required(),
		  }),
		```

	- package.json파일에서 scripts 를 수정한다, 즉 cross-env를 사용하여 `NODE_ENV`를 설정해준다.

		```json
		"scripts": {
		  ...
		  "start": "cross-env NODE_ENV=prod nest start",
		  "start:dev": "cross-env NODE_ENV=dev nest start --watch",
		  ...
		  "test": "cross-env NODE_ENV=test jest",
		  ...
		},
		```

	- Joi 패키지를 다음 방법으로 임포트 한다. `import * as Joi from 'joi';`
	- Joi 패키지를 통해 객체 유효성 검사를 한다.



### 4. Restaurant 모듈 생성

- 유효성 검사 패키지 설치 `npm install class-validator class-transformer`

- restaurant 모듈 구조

	```
	├── dtos 
	│   ├── create-restaurant.dto.ts
	│   └── update-restaurant.dto.ts
	├── restaurants.entity.ts
	├── restaurants.module.ts
	├── restaurants.providers.ts
	├── restaurants.resolver.ts
	└── restaurants.service.ts
	```

- entitiy : 데코레이터를 통해 typeORM의 Entity, Graphql의 ObjectType, InputType/ArgsType 으로 사용된다

	> @InputType(): 모든 필드들이 포함된 하나의 객체
	>
	> @ArgsType() : 필드들을 분리된 하나의 argument로 정의할 수 있도록 한다.

	```typescript
	@InputType({ isAbstract: true }) // DTO
	@ObjectType()
	@Entity()
	export class Restaurant {
	  @PrimaryGeneratedColumn() // generate id auto-increment
	  @Field(() => Number)
	  id: number;
	
	  @Field(() => String)
	  @IsString()
	  @Length(5, 10)
	  @Column()
	  name: string;
	
	  @Field(() => Boolean, { nullable: true, defaultValue: false })
	  @IsOptional()
	  @IsBoolean()
	  @Column()
	  isVegan?: boolean;
	
	  @Field(() => String)
	  @IsString()
	  @Column()
	  address: string;
	
	  @Field(() => String)
	  @IsString()
	  @Column()
	  ownerName: string;
	
	  @Field(() => String)
	  @IsString()
	  @Column()
	  categoryName: string;
	
	  @Field(() => String, { nullable: true, defaultValue: 'not-null' })
	  @IsString()
	  @Column()
	  nullableTestFiled?: string;
	}
	```

- DTOs - Mapped Type(OmitType, PickType, PartialType...) 사용, 즉 Restaurant 클래스(Entity)의 필드들을 매핑하여 DTO를 생성한다. 이 때 parentType인 Entity는 ObjectType으로 정의되어 있는데 Mapped Type을 사용하기 위해서는 parent가 InputType이어야 한다. 따라서 위의 Entity 코드에서 확인할 수 있듯이 `@InputType({ isAbstract: true }) ` 데코레이터를 명시해줘야 한다. -> 이는 InputType은 스키마에 포함되지 않고 어딘가에서 복사해서 쓰여짐을 의미한다. 

	```typescript
	@InputType() 
	export class CreateRestaurantDto extends OmitType(Restaurant,['id'],// InputType) Dto(child)의 타입은 InputType, Restaurant(parent) 타입을 ObjectType 로 지정했기 때문에 세번째 인자에서 데코레이터 InputType 을 전달하여 변환해 준다.
	) {}
	
	@InputType()
	export class UpdateRestaurantInputType extends PartialType(
	  CreateRestaurantDto,
	) {}
	
	@ArgsType()
	export class UpdateRestaurantDto {
	  @Field(() => Number)
	  id: number;
	  @Field(() => UpdateRestaurantInputType)
	  data: UpdateRestaurantInputType;
	}
	```

- Providers : repository provider -> DataSource를 통해 해당 모듈의 엔티티에 매핑된 Repository를 provide한다

	```typescript
	export const restaurantsProviders = [
	  {
	    provide: 'RESTAURANTS_REPOSITORY',
	    useFactory: (dataSource: DataSource) =>
	      dataSource.getRepository(Restaurant),
	    inject: ['DATA_SOURCE'],
	  },
	];
	```

- Service

	- constructor를 통해 repository를 injection 하고 비즈니스 로직을 구성한다

	```typescript
	@Injectable()
	export class RestaurantsService {
	  constructor(
	    @Inject('RESTAURANTS_REPOSITORY')
	    private readonly restaurantRepository: Repository<Restaurant>,
	  ) {}
	  async findAll(): Promise<Restaurant[]> {
	    return this.restaurantRepository.find();
	  }
	  async createRestaurant(
	    createRestaurantDto: CreateRestaurantDto,
	  ): Promise<Restaurant> {
	    const newRestaurant = this.restaurantRepository.create(createRestaurantDto);
	    return this.restaurantRepository.save(newRestaurant);
	  }
	
	  async updateRestaurant({ id, data }: UpdateRestaurantDto) {
	    return this.restaurantRepository.update(id, { ...data });
	  }
	}
	```

- resolver 

	- constructor를 통해 service를 injection 하고 서비스 로직을 수행한다.

	```typescript
	@Resolver(() => Restaurant)
	export class RestaurantsResolver {
	  constructor(private readonly restaurantsService: RestaurantsService) {}
	
	  @Query(() => [Restaurant])
	  restaurants(): Promise<Restaurant[]> {
	    return this.restaurantsService.findAll();
	  }
	
	  @Mutation(() => Boolean)
	  async createRestaurant(
	    // @Args('createRestaurantDto') createRestaurantDto: CreateRestaurantDto,
	    @Args('input') createRestaurantDto: CreateRestaurantDto,
	  ): Promise<boolean> {
	    try {
	      await this.restaurantsService.createRestaurant(createRestaurantDto);
	      return true;
	    } catch (e) {
	      console.log(e);
	      return false;
	    }
	  }
	
	  @Mutation(() => Boolean)
	  async updateRestaurant(
	    @Args() updateRestaurantDto: UpdateRestaurantDto,
	  ): Promise<boolean> {
	    try {
	      await this.restaurantsService.updateRestaurant(updateRestaurantDto);
	      return true;
	    } catch (e) {
	      console.log(e);
	      return false;
	    }
	  }
	}
	```

- module : import할 모듈 및 providers를 설정한다

	```typescript
	@Module({
	  imports: [DatabaseModule],
	  providers: [RestaurantsResolver, RestaurantsService, ...restaurantsProviders],
	})
	export class RestaurantsModule {}
	```
