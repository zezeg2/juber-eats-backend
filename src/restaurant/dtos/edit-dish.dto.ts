import {
  Field,
  InputType,
  Int,
  ObjectType,
  PartialType,
} from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { CreateDishInput } from './create-dish.dto';

@InputType()
export class EditDishInput extends PartialType(CreateDishInput) {
  @Field(() => Int)
  dishId: number;
}

@ObjectType()
export class EditDishOutput extends CoreOutput {}
