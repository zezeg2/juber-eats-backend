import { Injectable } from '@nestjs/common';
import { Restaurant } from './entities/restaurants.entity';
import { DataSource, ILike, Repository } from 'typeorm';
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
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { GetCategoryInput, GetCategoryOutput } from './dtos/get-category.dto';
import { PAGINATION_SIZE } from '../common/dtos/pagination.dto';
import {
  AllRestaurantsInput,
  AllRestaurantsOutput,
} from './dtos/all-restaurants.dto';
import {
  GetRestaurantInput,
  GetRestaurantOutput,
} from './dtos/get-restaurant.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { Dish } from '../dish/dish.entity';

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
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
      await this.checkRestaurant(editRestaurantInput.restaurantId, owner.id);
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
    } catch (error) {
      return {
        isOK: false,
        error: error.message(),
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      await this.checkRestaurant(deleteRestaurantInput.restaurantId, owner.id);
      await this.restaurantRepository.delete(
        deleteRestaurantInput.restaurantId,
      );
    } catch (error) {
      return {
        isOK: false,
        error: error.message(),
      };
    }
  }

  async checkRestaurant(restaurantId, ownerId): Promise<void> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new Error('Not found restaurant');
    }
    if (ownerId !== restaurant.ownerId) {
      throw new Error("Cannot edit a restaurant that you don't own");
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await CategoryRepository(this.dataSource).find();
      return {
        isOK: true,
        categories,
      };
    } catch {
      return {
        isOK: false,
        error: 'Cannot load categories',
      };
    }
  }

  async countRestaurant(category: Category): Promise<number> {
    return await this.restaurantRepository.count({
      where: { category: { id: category.id } },
    });
  }
  async getCategoryBySlug({
    slug,
    page,
  }: GetCategoryInput): Promise<GetCategoryOutput> {
    try {
      const category = await CategoryRepository(this.dataSource).findOne({
        where: { slug },
      });
      if (!category) {
        return {
          isOK: false,
          error: 'Category Not found',
        };
      }
      const [restaurants, totalCount] =
        await this.restaurantRepository.findAndCount({
          where: { category: { id: category.id } },
          take: PAGINATION_SIZE,
          skip: (page - 1) * PAGINATION_SIZE,
        });
      category.restaurants = restaurants;
      return {
        isOK: true,
        result: category,
        totalCount,
        totalPage: Math.ceil(totalCount / PAGINATION_SIZE),
      };
    } catch {
      return {
        isOK: false,
        error: 'Cannot get category',
      };
    }
  }

  async allRestaurants({
    page,
  }: AllRestaurantsInput): Promise<AllRestaurantsOutput> {
    try {
      const [restaurants, totalCount] =
        await this.restaurantRepository.findAndCount({
          take: PAGINATION_SIZE,
          skip: (page - 1) * PAGINATION_SIZE,
        });
      return {
        isOK: true,
        result: restaurants,
        totalCount,
        totalPage: Math.ceil(totalCount / PAGINATION_SIZE),
      };
    } catch {
      return {
        isOK: false,
        error: 'Cannot load Restaurants',
      };
    }
  }

  async findRestaurantById({
    restaurantId,
  }: GetRestaurantInput): Promise<GetRestaurantOutput> {
    try {
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: restaurantId },
        relations: ['menu'],
      });
      if (!restaurant) {
        return {
          isOK: false,
          error: 'Restaurant not found',
        };
      }
      return {
        isOK: true,
        result: restaurant,
      };
    } catch {
      return {
        isOK: false,
        error: 'Cannot find Restaurant',
      };
    }
  }

  async searchRestaurantByName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalCount] =
        await this.restaurantRepository.findAndCount({
          where: { name: ILike(`%${query}%`) },
          take: PAGINATION_SIZE,
          skip: (page - 1) * PAGINATION_SIZE,
        });
      return {
        isOK: true,
        result: restaurants,
        totalCount,
        totalPage: Math.ceil(totalCount / PAGINATION_SIZE),
      };
    } catch {
      return {
        isOK: false,
        error: 'error',
      };
    }
  }
}
