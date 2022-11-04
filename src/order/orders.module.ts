import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderResolver } from './order.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/users.entity';
import { Order } from './entities/order.entity';
import { Restaurant } from '../restaurant/entities/restaurants.entity';
import { OrderDish } from './entities/order-dish.entity';
import { Dish } from '../dish/dish.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Restaurant, Order, Dish, OrderDish]),
  ],
  providers: [OrderService, OrderResolver],
})
export class OrderModule {}
