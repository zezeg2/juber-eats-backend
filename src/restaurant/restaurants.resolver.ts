import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Restaurant } from './restaurants.entity';
import { CreateRestraurantDto } from './dtos/create-restaurant.dto';

@Resolver(() => Restaurant)
export class RestaurantsResolver {
  @Query(() => [Restaurant])
  restaurants(@Args('veganOnly') veganOnly: boolean): Restaurant[] {
    return [];
  }

  @Mutation(() => Boolean)
  createRestaurant(
    // @Args('createRestraurantDto') createRestraurantDto: CreateRestraurantDto,
    @Args() createRestraurantDto: CreateRestraurantDto,
  ): boolean {
    console.log(createRestraurantDto);
    return true;
  }
}
