import { CoreOutput } from '../../common/dtos/output.dto';
import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { User } from '../entities/users.entity';

@InputType()
export class EditProfileInput extends PartialType(
  PickType(User, ['email', 'password']),
) {}
@ObjectType()
export class EditProfileOutput extends CoreOutput {
  @Field(() => User, { nullable: true })
  user?: User;
}
