import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { User } from '../../users/entities/users.entity';
import { Restaurant } from '../../restaurant/entities/restaurants.entity';

@InputType('PaymentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Payment extends CoreEntity {
  @Field(() => String)
  @Column()
  transactionId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.payments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  user?: User;

  @RelationId((payment: Payment) => payment.user)
  userId: number;

  @Field(() => Restaurant, { nullable: true })
  @ManyToOne(() => Restaurant)
  restaurant?: Restaurant;

  @Field(() => Int)
  @RelationId((payment: Payment) => payment.user)
  restaurantId: number;
}
