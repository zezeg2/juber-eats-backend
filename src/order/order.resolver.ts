import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { AuthUser } from '../auth/auth-user.decorator';
import { User, UserRole } from '../users/entities/users.entity';
import { Role } from '../auth/role.decorator';
import { GetOrdersOutput, GetOrdersInput } from './dtos/get-orders.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { PubSub } from 'graphql-subscriptions';
import { boolean } from 'joi';

const pubsub = new PubSub();
@Resolver(() => Order)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @Mutation(() => CreateOrderOutput)
  @Role([UserRole.Client])
  async createOrder(
    @AuthUser() user: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    return await this.orderService.createOrder(user, createOrderInput);
  }

  @Query(() => GetOrdersOutput)
  @Role(['Any'])
  async getOrders(
    @AuthUser() user: User,
    @Args('input') getOrdersInput: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    return await this.orderService.getOrders(user, getOrdersInput);
  }

  @Query(() => GetOrderOutput)
  @Role(['Any'])
  async getOrder(
    @AuthUser() user: User,
    @Args('input') getOrderInput: GetOrderInput,
  ): Promise<GetOrderOutput> {
    return await this.orderService.getOrder(user, getOrderInput);
  }

  @Mutation(() => EditOrderOutput)
  @Role([UserRole.Owner, UserRole.Delivery])
  async editOrder(
    @AuthUser() user: User,
    @Args('input') editOrderInput: EditOrderInput,
  ): Promise<EditOrderOutput> {
    return await this.orderService.editOrder(user, editOrderInput);
  }

  @Subscription(() => String)
  @Role(['Any'])
  orderSubscription(@AuthUser() user) {
    console.log(user);
    return pubsub.asyncIterator('hey-jh');
  }
  @Mutation(() => Boolean)
  ready() {
    pubsub.publish('hey-jh', { orderSubscription: 'hey im ready' });
    return true;
  }
}
