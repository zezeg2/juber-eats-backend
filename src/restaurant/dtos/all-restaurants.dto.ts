import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
} from '../../common/dtos/pagination.dto';
import { Restaurant } from '../entities/restaurants.entity';

@InputType()
export class AllRestaurantsInput extends PaginationInput {}
@ObjectType()
export class AllRestaurantsOutput extends PaginationOutput {
  @Field(() => [Restaurant], { nullable: true })
  result?: Restaurant[];
}
