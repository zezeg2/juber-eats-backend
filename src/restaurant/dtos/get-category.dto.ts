import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Category } from '../entities/category.entity';
import {
  PaginationInput,
  PaginationOutput,
} from '../../common/dtos/pagination.dto';

@InputType()
export class GetCategoryInput extends PaginationInput {
  @Field(() => String)
  slug: string;
}
@ObjectType()
export class GetCategoryOutput extends PaginationOutput {
  @Field(() => Category, { nullable: true })
  result?: Category;
}
