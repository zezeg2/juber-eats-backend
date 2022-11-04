import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { Column, Entity, OneToMany } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Restaurant } from './restaurants.entity';

@InputType('CategoryInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Category extends CoreEntity {
  @Field(() => String)
  @IsString()
  @Length(5, 20)
  @Column({ unique: true })
  name: string;
  @Field(() => String, { nullable: true })
  @IsString()
  @Column({ nullable: true })
  coverImage: string;

  @Field(() => String)
  @Column({ unique: true })
  @IsString()
  slug: string;

  @OneToMany(() => Restaurant, (restaurant) => restaurant.category)
  @Field(() => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
