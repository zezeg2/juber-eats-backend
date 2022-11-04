import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Dish } from './dish.entity';
import {
  CreateDishInput,
  CreateDishOutput,
} from '../restaurant/dtos/create-dish.dto';
import { Role } from '../auth/role.decorator';
import { User, UserRole } from '../users/entities/users.entity';
import { AuthUser } from '../auth/auth-user.decorator';
import {
  DeleteDishInput,
  DeleteDishOutput,
} from '../restaurant/dtos/delete-dish.dto';
import {
  EditDishInput,
  EditDishOutput,
} from '../restaurant/dtos/edit-dish.dto';
import { DishService } from './dish.service';

@Resolver(() => Dish)
export class DishResolver {
  constructor(private readonly dishService: DishService) {}

  @Mutation(() => CreateDishOutput)
  @Role([UserRole.Owner])
  async createDish(
    @AuthUser() authUser: User,
    @Args('input') createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    return await this.dishService.createDish(authUser, createDishInput);
  }

  @Mutation(() => DeleteDishOutput)
  @Role([UserRole.Owner])
  async deleteDish(
    @AuthUser() authUser: User,
    @Args('input') deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    return await this.dishService.deleteDish(authUser, deleteDishInput);
  }

  @Mutation(() => EditDishOutput)
  @Role([UserRole.Owner])
  async editDish(
    @AuthUser() authUser: User,
    @Args('input') editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    return await this.dishService.editDish(authUser, editDishInput);
  }
}
