import { Module } from '@nestjs/common';
import { DishService } from './dish.service';
import { DishResolver } from './dish.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from '../restaurant/entities/restaurants.entity';
import { Dish } from './dish.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Dish])],
  providers: [DishService, DishResolver],
})
export class DishModule {}
