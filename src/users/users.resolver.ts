import { User } from './entities/users.entity';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth-user.decorator';
import { UserProfileInput, UserProfileOutput } from './dtos/user.profile.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';

import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User)
  async findOne(@Args('id') id: number): Promise<User> {
    return await this.usersService.findById(id);
  }

  @Mutation(() => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    return await this.usersService.createAccount(createAccountInput);
  }

  @Mutation(() => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    return await this.usersService.login(loginInput);
  }

  @Query(() => UserProfileOutput)
  @UseGuards(AuthGuard)
  getLoginUserProfile(@AuthUser() authUser: User): UserProfileOutput {
    return { isOK: true, profile: authUser };
  }

  @Query(() => UserProfileOutput)
  @UseGuards(AuthGuard)
  async getUserProfile(
    @Args() userProfileInput: UserProfileInput,
  ): Promise<UserProfileOutput> {
    return this.usersService.getUserProfile(userProfileInput);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => EditProfileOutput)
  async editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    return this.usersService.editProfile(authUser.id, editProfileInput);
  }

  @Mutation(() => VerifyEmailOutput)
  async verifyEmail(
    @Args('input') { code }: VerifyEmailInput,
  ): Promise<VerifyEmailOutput> {
    return await this.usersService.verifyEmail(code);
  }
}
