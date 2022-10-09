import { Args, ArgsType, Field, InputType, OmitType } from '@nestjs/graphql';
import { Restaurant } from '../restaurants.entity';

@InputType() // 모든 필드들이 포함된 하나의 객체
// @ArgsType() // 필드들을 분리된 argument 로써 정의할 수 있게 해준다
// export class CreateRestaurantDto extends OmitType(Restaurant, ['id']) {
export class CreateRestaurantDto extends OmitType(
  Restaurant,
  ['id'],
  // InputType, // Dto(child)의 타입은 InputType, Restaurant(parent) 타입을 ObjectType 로 지정했기 때문에 세번째 인자에서 데코레이터 InputType 을 전달하여 변환해 준다.
) {
  // @Field(() => String)
  // name: string;
  // @Field(() => Boolean)
  // isVegan: boolean;
  // @Field(() => String)
  // address: string;
  // @Field(() => String)
  // ownerName: string;
}
