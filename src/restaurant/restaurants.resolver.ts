import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Restaurant } from './restaurants.entity';
import { CreateRestraurantDto } from './dtos/create-restaurant.dto';
import { RestaurantsService } from './restaurants.service';

@Resolver(() => Restaurant)
export class RestaurantsResolver {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Query(() => [Restaurant])
  restaurants(): Promise<Restaurant[]> {
    return this.restaurantsService.findAll();
  }
  @Mutation(() => Boolean)
  createRestaurant(
    // @Args('createRestaurantDto') createRestaurantDto: CreateRestaurantDto,
    @Args() createRestaurantDto: CreateRestraurantDto,
  ): boolean {
    console.log(createRestaurantDto);
    return true;
  }
}
