import { Field, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field(() => Number)
  id: number;

  @Field(() => String)
  @IsString()
  @Length(5, 10)
  @Column()
  name: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @Column()
  isVegan?: boolean;

  @Field(() => String)
  @IsString()
  @Column()
  address: string;

  @Field(() => String)
  @IsString()
  @Column()
  ownerName: string;

  @Field(() => String)
  @IsString()
  @Column()
  categoryName: string;
}
