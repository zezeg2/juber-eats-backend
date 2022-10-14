import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '../jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { log } from 'util';
import { Verification } from './entities/verification.entity';
import { UserProfileInput } from './dtos/user.profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USERS_REPOSITORY')
    private readonly usersRepository: Repository<User>,
    @Inject('VERIFICATION_REPOSITORY')
    private readonly verificationRepository: Repository<Verification>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async findById(id: number): Promise<User> {
    return await this.usersRepository.findOne({ where: { id } });
  }

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    // check new user & create user
    try {
      if (await this.usersRepository.findOne({ where: { email } })) {
        return {
          isOK: false,
          error: 'There is a user with that email already',
        };
      }
      const user = await this.usersRepository.save(
        this.usersRepository.create({ email, password, role }),
      );
      await this.verificationRepository.save(
        this.verificationRepository.create({
          user,
        }),
      );
      return { isOK: true };
    } catch (e) {
      return { isOK: false, error: "Couldn't create account" };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.usersRepository.findOne({
        where: { email },
        select: ['id', 'password'],
      });
      if (!user)
        return {
          isOK: false,
          error: 'Not Found User',
        };
      if (!(await user.checkPassword(password)))
        return {
          isOK: false,
          error: 'Wrong Password',
        };
      console.log(user);
      const token = this.jwtService.sign(user.id);
      return {
        isOK: true,
        token,
      };
    } catch (error) {}
  }

  async getUserProfile(userProfileInput: UserProfileInput) {
    try {
      const user = await this.findById(userProfileInput.userId);
      if (!user) throw Error("Not Found User'");
      return {
        isOK: Boolean(user),
        user,
      };
    } catch (error) {
      return {
        isOK: false,
        error: error.message,
      };
    }
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.findById(userId);
      if (!user) throw new Error('Not Found User');
      if (email) {
        user.email = email;
        user.verified = false;
        await this.verificationRepository.save(
          this.verificationRepository.create({ user }),
        );
      }
      if (password) user.password = password;
      return { isOK: true, user: await this.usersRepository.save(user) };
    } catch (error) {
      return { isOK: false, error };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verificationRepository.findOne({
        where: { code },
        relations: ['user'],
      });
      if (verification) {
        verification.user.verified = true;
        await this.usersRepository.save(verification.user);
        await this.verificationRepository.delete(verification.id);
        return { isOK: true };
      }
      return { isOK: false, error: 'Verification not found' };
    } catch (error) {
      return { isOK: false, error };
    }
  }
}
