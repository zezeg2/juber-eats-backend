import { Module } from '@nestjs/common';
import {
  CategoryResolver,
  DishResolver,
  RestaurantsResolver,
} from './restaurants.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantsService } from './restaurants.service';
import { Restaurant } from './entities/restaurants.entity';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category, Dish])],
  providers: [
    RestaurantsResolver,
    CategoryResolver,
    DishResolver,
    RestaurantsService,
  ],
})
export class RestaurantsModule {}
