import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurants.entity';
import { CoreOutput } from '../../common/dtos/output.dto';
import { CreateRestaurantInput } from './create-restaurant.dto';

@InputType()
export class DeleteRestaurantInput {
  @Field(() => Number)
  restaurantId: number;
}

@ObjectType()
export class DeleteRestaurantOutput extends CoreOutput {}
