import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from '../restaurant/entities/restaurants.entity';
import { Dish } from './dish.entity';
import { User } from '../users/entities/users.entity';
import {
  CreateDishInput,
  CreateDishOutput,
} from '../restaurant/dtos/create-dish.dto';
import {
  DeleteDishInput,
  DeleteDishOutput,
} from '../restaurant/dtos/delete-dish.dto';
import {
  EditDishInput,
  EditDishOutput,
} from '../restaurant/dtos/edit-dish.dto';

@Injectable()
export class DishService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
  ) {}

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
        error: error.message,
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
        error: error.message,
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
