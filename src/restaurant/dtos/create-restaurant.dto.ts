import { Args, ArgsType, Field, InputType } from '@nestjs/graphql';

// @InputType() // 모든 필드들이 포함된 하나의 객체
@ArgsType() // 필드들을 분리된 argument 로써 정의할 수 있게 해준다
export class CreateRestraurantDto {
  @Field(() => String)
  name: string;
  @Field(() => Boolean)
  isVegan: boolean;
  @Field(() => String)
  address: string;
  @Field(() => String)
  ownerName: string;
}
