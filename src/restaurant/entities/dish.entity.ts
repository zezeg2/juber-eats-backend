import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { IsString, Length } from 'class-validator';
import { Restaurant } from './restaurants.entity';

@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
class DishChoice {
  @Field(() => String)
  name: string;

  @Field(() => Int, { nullable: true })
  extraFee?: number;
}

@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
class DishOption {
  @Field(() => String)
  name: string;

  @Field(() => [DishChoice], { nullable: true })
  choices?: DishChoice[];

  @Field(() => Int, { nullable: true })
  extraFee?: number;
}

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
  @Column()
  price: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @Column({ nullable: true })
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

  @Field(() => [DishOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: DishOption[];
}
