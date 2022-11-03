import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { AuthUser } from '../auth/auth-user.decorator';
import { User, UserRole } from '../users/entities/users.entity';
import { Role } from '../auth/role.decorator';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { PubSub } from 'graphql-subscriptions';
import { Inject } from '@nestjs/common';
import {
  NEW_ACCEPTED_ORDER,
  NEW_COOKED_ORDER,
  NEW_PENDING_ORDER,
  GET_ORDER_STATE,
  PUB_SUB,
} from '../common/common.constants';
import { GetOrderSubsInput } from './dtos/get-order-subs.dto';

@Resolver(() => Order)
export class OrderResolver {
  constructor(
    private readonly orderService: OrderService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

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

  @Role([UserRole.Owner])
  @Subscription(() => Order, {
    filter: ({ ownerId }, _, { user }) => {
      return ownerId === user.id;
    },
    resolve: ({ order }) => order,
  })
  pendingOrders() {
    return this.pubSub.asyncIterator(NEW_PENDING_ORDER);
  }

  @Role([UserRole.Delivery, UserRole.Client])
  @Subscription(() => Order, {
    filter: ({ order }, _, { user }) => {
      return user.role === UserRole.Delivery || user.id === order.customerId;
    },
    resolve: ({ order }) => order,
  })
  acceptedOrder() {
    return this.pubSub.asyncIterator(NEW_ACCEPTED_ORDER);
  }

  @Role([UserRole.Delivery, UserRole.Client])
  @Subscription(() => Order, {
    filter: ({ order }, _, { user }) => {
      return user.id === order.customerId || user.id === user.driverId;
    },
    resolve: ({ order }) => order,
  })
  cookedOrder() {
    return this.pubSub.asyncIterator(NEW_COOKED_ORDER);
  }

  @Role(['Any'])
  @Subscription(() => Order, {
    filter: ({ order }, { input }, { user }) => {
      if (
        user.id !== order.customerId &&
        user.id !== order.driverId &&
        user.id !== order.restaurant.ownerId
      ) {
        return false;
      }
      if (!input.id) return true;
      return order.id === input.id;
    },
    resolve: ({ order }) => order,
  })
  getOrderSubs(@Args('input') getOrderSubsInput: GetOrderSubsInput) {
    return this.pubSub.asyncIterator(GET_ORDER_STATE);
  }
}
