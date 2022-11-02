import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { AuthUser } from '../auth/auth-user.decorator';
import { User, UserRole } from '../users/entities/users.entity';
import { Role } from '../auth/role.decorator';

@Resolver(() => Order)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @Mutation(() => CreateOrderOutput)
  @Role([UserRole.Client])
  async createOrder(
    @AuthUser() authUser: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    return await this.orderService.createOrder(authUser, createOrderInput);
  }
}
