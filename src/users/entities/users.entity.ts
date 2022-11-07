import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common';
import { IsBoolean, IsEmail, IsEnum, IsString, Length } from 'class-validator';
import { Restaurant } from '../../restaurant/entities/restaurants.entity';
import { Order } from '../../order/entities/order.entity';
import { Payment } from '../../payment/entities/payment.entity';

export enum UserRole {
  Owner = 'Owner',
  Client = 'Client',
  Delivery = 'Delivery',
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column({ unique: true })
  @IsEmail()
  @IsString()
  @Field(() => String)
  email: string;

  @IsString()
  @Length(5, 15)
  @Column({ select: false })
  @Field(() => String)
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  @Field(() => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @IsBoolean()
  @Field(() => Boolean)
  @Column({ default: false })
  verified: boolean;

  @OneToMany(() => Restaurant, (restaurant) => restaurant.owner, {
    nullable: true,
  })
  @Field(() => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];

  @OneToMany(() => Order, (order) => order.customer, { nullable: true })
  @Field(() => [Order], { nullable: true })
  orders?: Order[];

  @OneToMany(() => Order, (order) => order.driver, { nullable: true })
  @Field(() => [Order], { nullable: true })
  accepted?: Order[];

  @OneToMany(() => Payment, (payment) => payment.user, { nullable: true })
  @Field(() => [Payment], { nullable: true })
  payments?: Payment[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
      } catch (error) {
        console.log(error);
        throw new InternalServerErrorException();
      }
    }
  }

  async checkPassword(inputPwd: string): Promise<boolean> {
    try {
      return await bcrypt.compare(inputPwd, this.password);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
