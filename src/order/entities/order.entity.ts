import {
  Field,
  Float,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Column, Entity, JoinTable, ManyToOne, OneToMany } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { User } from '../../users/entities/users.entity';
import { Restaurant } from '../../restaurant/entities/restaurants.entity';
import { OrderDish } from './order-dish.entity';
import { IsEnum } from 'class-validator';

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPT = 'ACCEPT',
  PICKUP = 'PICKUP',
  DELIVERED = 'DELIVERED',
}
registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  customer?: User;

  @ManyToOne(() => User, (user) => user.accepted, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @Field(() => User, { nullable: true })
  driver?: User;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.orders, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @Field(() => Restaurant, { nullable: true })
  restaurant?: Restaurant;

  @Field(() => [OrderDish])
  @OneToMany(() => OrderDish, (orderDish) => orderDish.order)
  @JoinTable()
  dishes: OrderDish[];

  @Field(() => Float, { nullable: true })
  @Column({ nullable: true })
  total?: number;

  @Field(() => OrderStatus)
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
