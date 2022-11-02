import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Order, OrderStatus } from '../entities/order.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class GetOrderInput extends PickType(Order, ['id']) {}

@ObjectType()
export class GetOrderOutput extends CoreOutput {
  @Field(() => Order, { nullable: true })
  order?: Order;
}
