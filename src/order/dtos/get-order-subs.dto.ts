import { InputType, PartialType, PickType } from '@nestjs/graphql';
import { Order } from '../entities/order.entity';

@InputType()
export class GetOrderSubsInput extends PartialType(PickType(Order, ['id'])) {}
