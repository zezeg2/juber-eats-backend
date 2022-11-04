import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { UserRole } from '../entities/users.entity';
import { Column } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';

@ObjectType()
export class Profile extends CoreEntity {
  @Field(() => String)
  email: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => Boolean)
  @Column({ default: false })
  verified: boolean;
}

@ArgsType()
export class UserProfileInput {
  @Field(() => Number)
  userId: number;
}

@ObjectType()
export class UserProfileOutput extends CoreOutput {
  @Field(() => Profile, { nullable: true })
  profile?: Profile;
}
