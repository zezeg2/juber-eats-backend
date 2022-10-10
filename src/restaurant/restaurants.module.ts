import { Module } from '@nestjs/common';
import { RestaurantsResolver } from './restaurants.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './restaurants.entity';
import { RestaurantsService } from './restaurants.service';
import { DatabaseModule } from '../database/database.module';
import { restaurantsProviders } from './restaurants.providers';

@Module({
  imports: [DatabaseModule],
  providers: [RestaurantsResolver, RestaurantsService, ...restaurantsProviders],
})
export class RestaurantsModule {}
