import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { Category } from '../entities/category.entity';

@ArgsType()
export class GetCategoryInput {
  @Field(() => String)
  slug: string;
}
@ObjectType()
export class GetCategoryOutput extends CoreOutput {
  @Field(() => Category, { nullable: true })
  category?: Category;
}
