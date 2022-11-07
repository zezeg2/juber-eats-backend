import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Payment } from './entities/payment.entity';
import { PaymentService } from './payment.service';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { Role } from '../auth/role.decorator';
import { User, UserRole } from '../users/entities/users.entity';
import { AuthUser } from '../auth/auth-user.decorator';
import { GetPaymentsOutput } from './dtos/get-payments.dto';

@Resolver(() => Payment)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}
  @Mutation(() => CreatePaymentOutput)
  @Role([UserRole.Owner])
  async createPayment(
    @AuthUser() user: User,
    @Args('input') createPaymentInput: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    return await this.paymentService.createPayment(user, createPaymentInput);
  }

  @Query(() => GetPaymentsOutput)
  @Role([UserRole.Owner])
  async getPayments(@AuthUser() user: User): Promise<GetPaymentsOutput> {
    return await this.paymentService.getPayments(user);
  }
}
