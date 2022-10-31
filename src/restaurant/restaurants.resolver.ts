import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurants.entity';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { RestaurantsService } from './restaurants.service';
import { AuthUser } from '../auth/auth-user.decorator';
import { User, UserRole } from '../users/entities/users.entity';
import { Role } from '../auth/role.decorator';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';

@Resolver(() => Restaurant)
export class RestaurantsResolver {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Mutation(() => CreateRestaurantOutput)
  @Role([UserRole.Owner])
  async createRestaurant(
    @AuthUser() authUser: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return await this.restaurantsService.createRestaurant(
      authUser,
      createRestaurantInput,
    );
  }

  @Mutation(() => EditRestaurantOutput)
  @Role([UserRole.Owner])
  async editRestaurant(
    @AuthUser() authUser: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return await this.restaurantsService.editRestaurant(
      authUser,
      editRestaurantInput,
    );
  }

  @Mutation(() => DeleteRestaurantOutput)
  @Role([UserRole.Owner])
  async deleteRestaurant(
    @AuthUser() authUser: User,
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    return await this.restaurantsService.deleteRestaurant(
      authUser,
      deleteRestaurantInput,
    );
  }
}
