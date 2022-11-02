import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { OrderDishOption } from '../entities/order-dish.entity';

@InputType()
class CreateOrderDishInput {
  @Field(() => Int)
  dishId: number;

  @Field(() => [OrderDishOption], { nullable: true })
  options?: OrderDishOption[];
}
@InputType()
export class CreateOrderInput {
  @Field(() => Int)
  restaurantId: number;

  @Field(() => [CreateOrderDishInput])
  dishes: CreateOrderDishInput[];
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {}
