# Juber Eats - uberEats Clone
## Authentication Parameter Decorator

> *데코레이터*는 [클래스 선언](https://www.typescriptlang.org/ko/docs/handbook/decorators.html#클래스-데코레이터-class-decorators), [메서드](https://www.typescriptlang.org/ko/docs/handbook/decorators.html#메서드-데코레이터-method-decorators), [접근자](https://www.typescriptlang.org/ko/docs/handbook/decorators.html#접근자-데코레이터-accessor-decorators), [프로퍼티](https://www.typescriptlang.org/ko/docs/handbook/decorators.html#프로퍼티-데코레이터-property-decorators) 또는 [매개 변수](https://www.typescriptlang.org/ko/docs/handbook/decorators.html#매개변수-데코레이터-parameter-decorators)에 첨부할 수 있는 특수한 종류의 선언입니다. 데코레이터는 `@expression` 형식을 사용합니다. 여기서 `expression`은 데코레이팅 된 선언에 대한 정보와 함께 런타임에 호출되는 함수여야 합니다.
>
> ```typescript
> function sealed(target) {
>     // 'target' 변수와 함께 무언가를 수행합니다.
> }
> ```
>
> 

> 데코레이터가 선언에 적용되는 방식을 원하는 대로 바꾸고 싶다면 데코레이터 팩토리를 작성할 수 있습니다. *데코레이터 팩토리*는 단순히 데코레이터가 런타임에 호출할 표현식을 반환하는 함수입니다.
>
> 다음과 같은 방식으로 데코레이터 팩토리를 작성할 수 있습니다.
>
> ```typescript
> function color(value: string) { // 데코레이터 팩토리
>     return function (target) { // 데코레이터
>         // 'target'과 'value' 변수를 가지고 무언가를 수행합니다.
>   };
> }
> ```
>
>  *from typescript docs*



Nest에서는 parameter Decorator를 만들 수 있도록 `@nestjs/common` 으로 부터 `createParamDecorator()` 함수를 사용할 수 있다.

1. 요청이 Authentication midlleware를 지나 jwt토큰으로부터 유저정보를 가져오고, (`req['user']= user`) 
2. 요청으로부터 유저정보를 gqlContext(Execution Context)에 등록하게 된다. 
3. 이 때 gqlContext의 유저 인스턴스를 가져오는 데코레이터를 만들어 보자

```typescript
export const AuthUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user = gqlContext['user'];
    return user;
  },
);
```

해당 데코레이터를 resolver의 parameter에 적용하면 토큰이 인증된 요청에 한해 서비스에 접근할 수 있고 컨텍스트로부터 인증된 유저 객체를 가져올 수 있다.

```typescript
@Query(() => User)
@UseGuards(AuthGuard)
me(@AuthUser() authUser: User) {
  return authUser;
}
```



### src 구조

```shell
├── app.module.ts
├── auth
│   ├── auth-user.decorator.ts
│   └── auth.guard.ts (+)

...
```



