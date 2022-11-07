import { Module } from '@nestjs/common';
import { CategoryResolver, RestaurantsResolver } from './restaurants.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantsService } from './restaurants.service';
import { Restaurant } from './entities/restaurants.entity';
import { Category } from './entities/category.entity';
import { Dish } from '../dish/dish.entity';
import { CategoryRepositoryProvider } from './repositories/category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category, Dish])],
  providers: [
    RestaurantsResolver,
    CategoryResolver,
    RestaurantsService,
    CategoryRepositoryProvider,
  ],
})
export class RestaurantsModule {}
