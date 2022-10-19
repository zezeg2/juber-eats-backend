import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';

@InputType({ isAbstract: true })
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

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
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

  @Field(() => String, { nullable: true, defaultValue: 'not-null' })
  @IsString()
  @Column()
  nullableTestFiled?: string;
}
