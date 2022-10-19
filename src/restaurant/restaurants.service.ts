import { Inject, Injectable } from '@nestjs/common';
import { Restaurant } from './restaurants.entity';
import { Repository } from 'typeorm';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}
  async findAll(): Promise<Restaurant[]> {
    return this.restaurantRepository.find();
  }
  async createRestaurant(
    createRestaurantDto: CreateRestaurantDto,
  ): Promise<Restaurant> {
    const newRestaurant = this.restaurantRepository.create(createRestaurantDto);
    return this.restaurantRepository.save(newRestaurant);
  }

  async updateRestaurant({ id, data }: UpdateRestaurantDto) {
    return this.restaurantRepository.update(id, { ...data });
  }
}
