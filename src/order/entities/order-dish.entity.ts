import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Dish } from '../../dish/dish.entity';
import { Order } from './order.entity';

@InputType('OrderDishOptionInputType', { isAbstract: true })
@ObjectType()
export class OrderDishOption {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  choice?: string;
}

@InputType('OrderDishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderDish extends CoreEntity {
  @ManyToOne(() => Order, { nullable: true, onDelete: 'CASCADE' })
  order: Order;

  @Field(() => Dish)
  @ManyToOne(() => Dish, { nullable: true, onDelete: 'CASCADE' })
  dish: Dish;

  @Field(() => [OrderDishOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: OrderDishOption[];
}
