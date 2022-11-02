import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { User, UserRole } from '../users/entities/users.entity';
import { Restaurant } from '../restaurant/entities/restaurants.entity';
import { OrderDish } from './entities/order-dish.entity';
import { Dish } from '../dish/dish.entity';
import { GetOrdersOutput, GetOrdersInput } from './dtos/get-orders.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';

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

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      if (user.role === UserRole.Client) {
        orders = await this.orderRepository.find({
          where: { customer: { id: user.id }, ...(status && { status }) },
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orderRepository.find({
          where: { driver: { id: user.id }, ...(status && { status }) },
        });
      } else if (user.role === UserRole.Owner) {
        orders = await this.restaurantRepository
          .find({
            where: { owner: { id: user.id } },
            relations: ['orders'],
          })
          .then((result) =>
            result
              .map((restaurant) => restaurant.orders)
              .flat(1)
              .filter((order) => {
                if (status) {
                  return order.status === status;
                }
              }),
          );
      }
      return {
        isOK: true,
        orders,
      };
    } catch (error) {
      return {
        isOK: false,
        error: 'Cannot get orders',
      };
    }
  }

  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['restaurant'],
      });
      if (!order) throw new Error('Order not found');
      if (
        order.customerId !== user.id &&
        order.driverId !== user.id &&
        order.restaurant.ownerId !== user.id
      ) {
        throw new Error('You cannot see that');
      }
      return {
        isOK: true,
        order,
      };
    } catch (error) {
      return {
        isOK: false,
        error: error.message(),
      };
    }
  }
}
