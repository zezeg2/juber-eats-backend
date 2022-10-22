import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MutationOutput {
  @Field(() => Boolean)
  isOK: boolean;
  @Field(() => String, { nullable: true })
  error?: string;
}
