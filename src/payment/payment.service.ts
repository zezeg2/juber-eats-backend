import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { User } from '../users/entities/users.entity';
import { Restaurant } from '../restaurant/entities/restaurants.entity';
import { GetPaymentsOutput } from './dtos/get-payments.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async createPayment(
    owner: User,
    { transactionId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: restaurantId },
      });
      if (!restaurant) throw new Error('Restaurant not found');
      if (restaurant.ownerId !== owner.id)
        throw new Error('You cannot do this');
      await this.paymentRepository.save(
        this.paymentRepository.create({
          transactionId,
          user: owner,
          restaurant,
        }),
      );
      return {
        isOK: true,
      };
    } catch (error) {
      return {
        isOK: true,
        error: error.message,
      };
    }
  }

  async getPayments(owner: User): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.paymentRepository.find({
        where: { user: { id: owner.id } },
      });
      return {
        isOK: true,
        payments,
      };
    } catch (error) {
      return {
        isOK: false,
        error: 'Cannot load payments',
      };
    }
  }
}
