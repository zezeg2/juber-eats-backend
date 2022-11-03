import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { User, UserRole } from '../users/entities/users.entity';
import { Restaurant } from '../restaurant/entities/restaurants.entity';
import { OrderDish } from './entities/order-dish.entity';
import { Dish } from '../dish/dish.entity';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import {
  NEW_ACCEPTED_ORDER,
  NEW_COOKED_ORDER,
  NEW_PENDING_ORDER,
  GET_ORDER_STATE,
  PUB_SUB,
} from '../common/common.constants';
import { PubSub } from 'graphql-subscriptions';

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

    @Inject(PUB_SUB) private readonly pubSub: PubSub,
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
      let order = await this.orderRepository.save(
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

      order = await this.orderRepository.findOne({
        where: { id: order.id },
        relations: ['dishes.dish'],
      });
      await this.pubSub.publish(NEW_PENDING_ORDER, {
        order,
        ownerId: restaurant.ownerId,
      });
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
    } catch {
      return {
        isOK: false,
        error: 'Cannot get orders',
      };
    }
  }

  async checkAndGetOrder(
    orderId: number,
    user: User,
    options?: FindOneOptions<Order>,
  ): Promise<Order> {
    options.relations;
    const order = await this.orderRepository.findOne({
      ...options,
      where: { id: orderId, ...options.where },
      relations: options.relations
        ? ['restaurant'].concat(options.relations as string[])
        : ['restaurant'],
    });
    if (!order) throw new Error('Order not found');
    if (
      order.customerId !== user.id &&
      order.driverId !== user.id &&
      order.restaurant.ownerId !== user.id
    ) {
      throw new Error('Permission Denied');
    }
    return order;
  }

  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.checkAndGetOrder(orderId, user);
      return {
        isOK: true,
        order,
      };
    } catch (error) {
      return { isOK: false, error: error.message };
    }
  }

  async editOrder(
    user: User,
    { id: orderId, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      switch (user.role) {
        case UserRole.Owner:
          if (
            status === OrderStatus.PICKUP ||
            status === OrderStatus.DELIVERED
          ) {
            throw new Error('You cannot edit order');
          }
          break;
        case UserRole.Delivery:
          if (status === OrderStatus.ACCEPT || status === OrderStatus.COOKED) {
            throw new Error('You cannot edit order');
          }
          break;
      }
      let order = await this.checkAndGetOrder(orderId, user, {
        relations: ['dishes.dish'],
      });
      order = await this.orderRepository.save({
        ...order,
        ...(status && { status }),
      });
      if (status === OrderStatus.ACCEPT) {
        await this.pubSub.publish(NEW_ACCEPTED_ORDER, { order });
      } else if (status === OrderStatus.COOKED) {
        await this.pubSub.publish(NEW_COOKED_ORDER, { order });
      } else {
        await this.pubSub.publish(GET_ORDER_STATE, {
          order,
          ownerId: order.restaurant.ownerId,
        });
      }
      return {
        isOK: true,
      };
    } catch (error) {
      return { isOK: false, error: error.message };
    }
  }
}
