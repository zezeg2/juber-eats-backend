import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { JwtService } from '../jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { UserProfileInput, UserProfileOutput } from './dtos/user.profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { MailService } from '../mail/mail.service';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Verification)
    private readonly verificationRepository: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
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
      const verification = await this.verificationRepository.save(
        this.verificationRepository.create({
          user,
        }),
      );
      this.mailService.sendVerificationEmail(user.email, verification.code);
      return { isOK: true };
    } catch (e) {
      return { isOK: false, error: "Couldn't create account" };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.usersRepository.findOne({
        select: ['id', 'password'],
        where: { email },
      });
      if (!user) return { isOK: false, error: 'Not Found User' };
      if (!(await user.checkPassword(password)))
        return { isOK: false, error: 'Wrong Password' };
      const token = this.jwtService.sign(user.id);
      return { isOK: true, token };
    } catch (error) {
      return { isOK: false, error };
    }
  }

  async getUserProfile(
    userProfileInput: UserProfileInput,
  ): Promise<UserProfileOutput> {
    try {
      const user = await this.findById(userProfileInput.userId);
      if (!user) throw Error('Not Found User');
      return {
        isOK: Boolean(user),
        profile: user,
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
      const user = await this.usersRepository.findOneOrFail({
        where: { id: userId },
      });
      if (email) {
        user.email = email;
        user.verified = false;
        await this.verificationRepository.delete({ user: { id: user.id } });
        const verification = await this.verificationRepository.save(
          this.verificationRepository.create({ user }),
        );
        this.mailService.sendVerificationEmail(user.email, verification.code);
      }
      if (password) {
        user.password = password;
      }
      await this.usersRepository.save(user);
      return { isOK: true };
    } catch (error) {
      return { isOK: false, error: 'Not Found User' };
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
      return { isOK: false, error: 'Could not verify email' };
    }
  }
}
