import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from './restaurants.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RestaurantsService {
  constructor(
    @Inject('RESTAURANTS_REPOSITORY')
    private readonly RestaurantRepository: Repository<Restaurant>,
  ) {}
  async findAll(): Promise<Restaurant[]> {
    return this.RestaurantRepository.find();
  }
}
