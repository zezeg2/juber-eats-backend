import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { IsString, Length } from 'class-validator';
import { Restaurant } from './restaurants.entity';

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Field(() => String)
  @IsString()
  @Length(1, 20)
  @Column({ unique: true })
  name: string;

  @Field(() => Int)
  @IsString()
  @Column()
  price: number;

  @Field(() => String)
  @IsString()
  @Column()
  photo: string;

  @Field(() => String)
  @IsString()
  @Length(5, 140)
  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menu, {
    onDelete: 'CASCADE',
  })
  @Field(() => Restaurant)
  @IsString()
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;

  // @Column({type: 'json'})
}
