import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Category } from './category.entity';
import { User } from '../../users/entities/users.entity';
import { Dish } from './dish.entity';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  @Field(() => String)
  @IsString()
  @Length(5, 20)
  @Column()
  name: string;

  @Field(() => String)
  @IsString()
  @Column()
  address: string;

  @Field(() => String)
  @IsString()
  @Column()
  coverImage: string;

  @ManyToOne(() => Category, (category) => category.restaurants, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @Field(() => Category, { nullable: true })
  @IsString()
  category: Category;

  @ManyToOne(() => User, (user) => user.restaurants, { onDelete: 'CASCADE' })
  @Field(() => User)
  @IsString()
  owner: User;

  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @OneToMany(() => Dish, (dish) => dish.restaurant)
  menu: Dish[];
}
