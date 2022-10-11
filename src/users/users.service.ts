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
import { EditProfileInput } from './dtos/edit-profile.dto';
import { log } from 'util';

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

  async findById(id: number): Promise<User> {
    return await this.usersRepository.findOne({ where: { id } });
  }

  // 강의에서는 object 로 인풋을 받을때 input 필드중 하나라도 빠질 시 해당 값이 undefined 값이 설정되어 Exception 발생 (typeorm repository 의 update 메서드에서 예외 발생시킴),
  // 내 코드에는 같은방법으로 필드값을 update 메서드에 전달했지만 잘 실행 됨, 업데이트 된듯?
  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<User> {
    /**
     * update() 쿼리 문제점 :
     * password 를 변경할때 문제가 발생하는데, password 를 해시하여 db에 저장하는것이 올바른 로직이지만 @BeforeUpdate() decorator 를 사용해도 User Entity의 hashPassword 메서드가
     * 실행되지 않는다. 이는 update() 메서드가 Entity 가 존재하는지 확인하지 않고 db에 직접적으로 쿼리를 날릴 뿐이기 때문이다. 다시 말해 Entity 를 찾고 그 인스턴스에서 메서드를 실행시키지 않기떄문에
     * 데코레이터가 무시된다고 할 수 있다.
     *
     */

    // return await this.usersRepository.update(
    //   { id: userId },
    //   { email, password },
    // );

    const user = await this.findById(userId);
    if (email) user.email = email;
    if (password) user.password = password;
    return this.usersRepository.save(user);
  }

  // async editProfile(userId: number, editProfileInput: EditProfileInput) {
  //   return await this.usersRepository.update(
  //     { id: userId },
  //     { ...editProfileInput },
  //   );
  // }
}
