import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurants.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class GetRestaurantInput {
  @Field(() => Int)
  restaurantId: number;
}
@ObjectType()
export class GetRestaurantOutput extends CoreOutput {
  @Field(() => Restaurant, { nullable: true })
  result?: Restaurant;
}
