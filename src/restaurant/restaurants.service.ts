import { Injectable } from '@nestjs/common';
import { Restaurant } from './entities/restaurants.entity';
import { Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/users.entity';
import { Category } from './entities/category.entity';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}
  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    const newRestaurant = this.restaurantRepository.create(
      createRestaurantInput,
    );
    newRestaurant.owner = owner;
    const categoryName = createRestaurantInput.categoryName
      .trim()
      .toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');
    let category = await this.categoryRepository.findOne({
      where: { slug: categorySlug },
    });
    if (!category) {
      category = await this.categoryRepository.save(
        this.categoryRepository.create({
          slug: categorySlug,
          name: categoryName,
        }),
      );
    }
    newRestaurant.category = category;
    try {
      await this.restaurantRepository.save(newRestaurant);
      return { isOK: true };
    } catch {
      return { isOK: false, error: 'Could not create restaurant' };
    }
  }
}
