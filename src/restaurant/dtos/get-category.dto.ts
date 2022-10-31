import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Category } from '../entities/category.entity';
import {
  PaginationInput,
  PaginationOutput,
} from '../../common/dtos/pagination.dto';

export const PAGINATION_SIZE = 5;
@InputType()
export class GetCategoryInput extends PaginationInput {
  @Field(() => String)
  slug: string;
}
@ObjectType()
export class GetCategoryOutput extends PaginationOutput {
  @Field(() => Category, { nullable: true })
  category?: Category;
}
