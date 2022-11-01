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
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { Dish } from './entities/dish.entity';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';

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

  countRestaurant(category: Category) {
    return this.restaurantRepository.count({
      where: { category: { id: category.id } },
    });
  }

  async getCategoryBySlug({
    slug,
    page,
  }: GetCategoryInput): Promise<GetCategoryOutput> {
    try {
      const category = await CategoryRepository(this.dataSource).findOneOrFail({
        where: { slug },
      });
      const restaurants = await this.restaurantRepository.find({
        where: { category: { id: category.id } },
        take: PAGINATION_SIZE,
        skip: (page - 1) * PAGINATION_SIZE,
      });
      category.restaurants = restaurants;
      const totalCount = await this.countRestaurant(category);
      return {
        isOK: true,
        result: category,
        totalCount,
        totalPage: Math.ceil(totalCount / PAGINATION_SIZE),
      };
    } catch {
      return {
        isOK: false,
        error: 'Category Not found',
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

  async getRestaurantById({
    restaurantId,
  }: GetRestaurantInput): Promise<GetRestaurantOutput> {
    try {
      const restaurant = await this.restaurantRepository.findOneOrFail({
        where: { id: restaurantId },
        relations: ['menu'],
      });
      return {
        isOK: true,
        result: restaurant,
      };
    } catch {
      return {
        isOK: false,
        error: 'Restaurant not found',
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

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurantRepository.findOneBy({
        id: createDishInput.restaurantId,
      });
      if (!restaurant) {
        return {
          isOK: false,
          error: 'Restaurant not found',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          isOK: false,
          error: 'Permission Denied',
        };
      }
      await this.dishRepository.save(
        this.dishRepository.create({ ...createDishInput, restaurant }),
      );
      return {
        isOK: true,
      };
    } catch {
      return {
        isOK: false,
        error: 'Cannot create dish',
      };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      await this.checkDish(owner.id, dishId);
      await this.dishRepository.delete(dishId);
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

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      await this.checkDish(owner.id, editDishInput.dishId);
      await this.dishRepository.save([
        {
          id: editDishInput.dishId,
          ...editDishInput,
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

  async checkDish(ownerId: number, dishId: number): Promise<Dish> {
    const dish = await this.dishRepository.findOne({
      where: { id: dishId },
      relations: ['restaurant'],
    });
    if (!dish) {
      throw new Error('Not found dish');
    }
    if (ownerId !== dish.restaurant.ownerId) {
      throw new Error('Permission Denied');
    }
    return dish;
  }
}
