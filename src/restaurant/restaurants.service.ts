import { Injectable } from '@nestjs/common';
import { Restaurant } from './entities/restaurants.entity';
import { DataSource, Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/users.entity';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { CategoryRepository } from './repositories/category.repository';
import { Category } from './entities/category.entity';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}
  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    const newRestaurant = this.restaurantRepository.create(
      createRestaurantInput,
    );
    newRestaurant.owner = owner;
    const category = await CategoryRepository(this.dataSource).getOrCreate(
      createRestaurantInput.categoryName,
    );
    newRestaurant.category = category;
    try {
      await this.restaurantRepository.save(newRestaurant);
      return { isOK: true };
    } catch {
      return { isOK: false, error: 'Could not create restaurant' };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restaurant = await this.restaurantRepository.findOneOrFail({
        where: { id: editRestaurantInput.restaurantId },
        // loadRelationIds: true,
      });
      if (owner.id !== restaurant.ownerId) {
        return {
          isOK: false,
          error: "Cannot edit a restaurant that you don't own",
        };
      }
      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await CategoryRepository(this.dataSource).getOrCreate(
          editRestaurantInput.categoryName,
        );
      }
      await this.restaurantRepository.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);
      return {
        isOK: true,
      };
    } catch {
      return {
        isOK: false,
        error: 'Restaurant Not found',
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurantRepository.findOneOrFail({
        where: { id: deleteRestaurantInput.restaurantId },
        // loadRelationIds: true,
      });
      if (owner.id !== restaurant.ownerId) {
        return {
          isOK: false,
          error: "Cannot edit a restaurant that you don't own",
        };
      }
      await this.restaurantRepository.delete(
        deleteRestaurantInput.restaurantId,
      );
    } catch {
      return {
        isOK: false,
        error: 'Restaurant Not found',
      };
    }
  }
}
