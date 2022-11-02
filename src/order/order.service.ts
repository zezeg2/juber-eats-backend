import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { User } from '../users/entities/users.entity';
import { Restaurant } from '../restaurant/entities/restaurants.entity';
import { OrderDish } from './entities/order-dish.entity';
import { Dish } from '../dish/dish.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,

    @InjectRepository(OrderDish)
    private readonly orderDishRepository: Repository<OrderDish>,

    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, dishes }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: restaurantId },
      });
      if (!restaurant) {
        throw Error('Restaurant not found');
      }
      const order = await this.orderRepository.save(
        this.orderRepository.create({ customer, restaurant }),
      );
      let orderPrice = 0;
      for (const item of dishes) {
        const dish = await this.dishRepository.findOne({
          where: { id: item.dishId },
        });
        if (!dish) {
          // abort this whole thing
        }
        let totalExtra = 0;
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            (option) => option.name === itemOption.name,
          );
          if (dishOption) {
            if (dishOption.extraFee) {
              totalExtra += dishOption.extraFee;
            } else {
              const choice = dishOption.choices.find(
                (choice) => choice.name === itemOption.choice,
              );
              if (choice.extraFee) {
                totalExtra += choice.extraFee;
              }
            }
          }
        }
        orderPrice += dish.price + totalExtra;

        await this.orderDishRepository.save(
          this.orderDishRepository.create({
            order,
            dish,
            options: item.options,
          }),
        );
      }
      await this.orderRepository.save({ ...order, total: orderPrice });
      return {
        isOK: true,
      };
    } catch (error) {
      return {
        isOK: false,
        error: 'Cannot create Order',
      };
    }
  }
}
