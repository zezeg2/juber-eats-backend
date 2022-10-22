# Juber Eats - uberEats Clone

## Additional User CRUD

- mutation :editProfile 추가

- users.resolver.ts

	```typescript
	@UseGuards(AuthGuard)
	  @Mutation(() => EditProfileOutput)
	  async editProfile(
	    @AuthUser() authUser: User,
	    @Args('input') editProfileInput: EditProfileInput,
	  ): Promise<EditProfileOutput> {
	    try {
	      const updated = await this.usersService.editProfile(
	        authUser.id,
	        editProfileInput,
	      );
	      if (!updated) throw new Error('Fail to Update Profile');
	      return {
	        isOK: true,
	        user: updated,
	      };
	    } catch (error) {
	      return { isOK: false, error };
	    }
	  }	
	```

- users.service.ts

	```typescript
	async editProfile(
	  userId: number,
	  { email, password }: EditProfileInput,
	): Promise<User> {
	  
	  // Solve Isuue1
	  const user = await this.findById(userId);
	  if (email) user.email = email;
	  if (password) user.password = password;
	  return this.usersRepository.save(user);
	
	  // Issue1
	  // return await this.usersRepository.update(
	  //   { id: userId },
	  //   { email, password },
	  // );
	}
	```



### Issues

#### 1. TypeOrm Update Query Issue

update() 쿼리 문제점 

password 를 변경할때 문제가 발생하는데, password 를 해시하여 db에 저장하는것이 올바른 로직임

* `@BeforeUpdate()` decorator를 User Entity의 `hashPassword()`에 적용했지만 메서드가 실행되지 않는다. 

=> 이는 typeorm 패키지의 `update()` 메서드가 Entity 가 존재하는지 확인하지 않고 DB에 직접적으로 쿼리를 날릴 뿐이기 때문이다. 다시 말해 Entity 를 찾고 그 인스턴스에서 메서드를 실행시키지 않기때문에 Decorator가 무시된다고 할 수 있다.

=> 즉 DB에 즉시 쿼리를 날리는 동작이 아닌 DB에서 먼저 조건에 맞는(findById) Entity를 찾고 해당 Entity의 인스턴스에 새로운 properties값을 적용하고 save하도록 하여 `@BeforeUpdate()` 데코레이터가 적용 되도록 한다



#### 2. Password rehash Issue

기존 UserRepository로부터 user entity를 가져오면 모든 필드를 가져오도록 설계되어 있음 즉 유저 업데이트 시

원본 비밀번호 -> hash(원본 비밀번호) -> hash(hash(원본 비밀번호)) 형태로 업데이트 되는 문제 발생

- User Entity의 password filed 수정 

- User Service의 login method 에서 UserRepository로부터 id, password를 select 하도록 명시

	```typescript
	// users.entity.ts
	@Column({ select: false })
	@Field(() => String)
	password: string;
	  
	// users.service.ts
	async login({ email, password }: LoginInput): Promise<LoginOutput> {
	  try {
	      const user = await this.usersRepository.findOne({
	        select: ['id', 'password'],
	        where: { email },
	      });
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

변경 없음
