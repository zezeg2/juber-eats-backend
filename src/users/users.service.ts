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

@Injectable()
export class UsersService {
  constructor(
    @Inject('USERS_REPOSITORY')
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}
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
      await this.usersRepository.save(
        this.usersRepository.create({ email, password, role }),
      );
      return { isOK: true };
    } catch (e) {
      return { isOK: false, error: "Couldn't create account" };
    }
    // hash the password
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    // find user with email
    // check if the password is correct
    // make a JWT and give it to user
    try {
      const user = await this.usersRepository.findOne({ where: { email } });
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
      const token = this.jwtService.sign(user.id);
      return {
        isOK: true,
        token,
      };
    } catch (error) {}
  }

  async findOne(email: string): Promise<User> {
    const exists = await this.usersRepository.findOne({ where: { email } });
    console.log(exists);
    return exists;
  }
}
