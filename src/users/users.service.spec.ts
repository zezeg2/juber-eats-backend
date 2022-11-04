import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';

import { Verification } from './entities/verification.entity';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/users.entity';

const mockRepository = () => ({
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = {
  sign: jest.fn(() => 'signed-token'),
  verify: jest.fn(),
};

const mockMailService = {
  sendVerificationEmail: jest.fn(),
};

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UsersService;
  let mailService: MailService;
  let jwtService: JwtService;
  let usersRepository: MockRepository<User>;
  let verificationsRepository: MockRepository<Verification>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
    usersRepository = module.get(getRepositoryToken(User));
    verificationsRepository = module.get(getRepositoryToken(Verification));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    const findByIdArgs = { id: 1 };
    it('should find an existingUser', async () => {
      usersRepository.findOne.mockResolvedValue(findByIdArgs);
      const result = await service.findById(1);
      expect(result).toEqual(findByIdArgs);
    });

    it('should return undefined if user not exist', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      const result = await service.findById(1);
      expect(result).toEqual(undefined);
    });
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: 'bs@email.com',
      password: 'bs.password',
      role: UserRole.Client,
    };

    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: '',
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        isOK: false,
        error: 'There is a user with that email already',
      });
    });

    it('should create a new user', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArgs);
      usersRepository.save.mockResolvedValue(createAccountArgs);
      verificationsRepository.create.mockReturnValue({
        user: createAccountArgs,
      });
      verificationsRepository.save.mockResolvedValue({
        code: 'code',
      });

      const result = await service.createAccount(createAccountArgs);

      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);

      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.save).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
      expect(result).toEqual({ isOK: true });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error('error'));
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({ isOK: false, error: "Couldn't create account" });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'bs@email.com',
      password: 'bs.password',
    };
    it('should fail if user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.login(loginArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(expect.any(Object));

      expect(result).toEqual({
        isOK: false,
        error: 'Not Found User',
      });
    });
    it('should fail if the password is wrong', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => {
          Promise.resolve(false);
        }),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        isOK: false,
        error: 'Wrong Password',
      });
    });

    it('should return token if password correct', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
      expect(result).toEqual({ isOK: true, token: 'signed-token' });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error('error'));
      const result = await service.login(loginArgs);
      expect(result).toEqual({ isOK: false, error: expect.any(Error) });
    });
  });

  describe('getUserProfile', () => {
    const getUserProfileArgs = { userId: 1 };
    it('should return userProfile', async () => {
      const userProfile = {
        id: 1,
        email: 'bs@email.com',
        password: 'bs.password',
      };
      usersRepository.findOne.mockResolvedValue(userProfile);
      const result = await service.getUserProfile(getUserProfileArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: getUserProfileArgs.userId },
      });
      expect(result).toEqual({ isOK: true, user: userProfile });
    });

    it('should fail if user not exists', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      const result = await service.getUserProfile(getUserProfileArgs);
      expect(result).toEqual({ isOK: false, error: 'Not Found User' });
    });
  });

  describe('editProfile', () => {
    it('should fail if user not exist', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(
        new Error('Not Found User'),
      );
      const result = await service.editProfile(1, {});
      expect(result).toEqual({ isOK: false, error: 'Not Found User' });
    });

    it('should create new verification and save it if email exist', async () => {
      const prevUserProfile = { email: 'bs@old.com', verified: true };
      const editProfileArgs = { userId: 1, input: { email: 'bs@new.com' } };
      const newVerification = { code: 'new-code' };
      const newUserProfile = {
        email: editProfileArgs.input.email,
        verified: false,
      };

      usersRepository.findOneOrFail.mockResolvedValue(prevUserProfile);
      verificationsRepository.create.mockReturnValue(newVerification);
      verificationsRepository.save.mockResolvedValue(newVerification);
      await service.editProfile(editProfileArgs.userId, editProfileArgs.input);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: editProfileArgs.userId },
      });
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: newUserProfile,
      });

      expect(verificationsRepository.save).toHaveBeenCalledWith(
        newVerification,
      );

      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUserProfile.email,
        newVerification.code,
      );
    });

    it('should change password', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { password: 'new.password' },
      };
      usersRepository.findOneOrFail.mockResolvedValue({
        password: 'old.password',
      });
      const result = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(editProfileArgs.input);
      expect(result).toEqual({ isOK: true });
    });
  });
  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const mockedVerification = { id: 1, user: { verified: false } };
      verificationsRepository.findOne.mockResolvedValue(mockedVerification);

      const result = await service.verifyEmail('code');
      expect(verificationsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
      );
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({ verified: true });
      expect(verificationsRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.delete).toHaveBeenCalledWith(
        mockedVerification.id,
      );
      expect(result).toEqual({ isOK: true });
    });
    it('should fail on verification not found', async () => {
      verificationsRepository.findOne.mockResolvedValue(undefined);
      const result = await service.verifyEmail('');
      expect(result).toEqual({ isOK: false, error: 'Verification not found' });
    });
    it('should fail on exception', async () => {
      verificationsRepository.findOne.mockRejectedValue(new Error());
      const result = await service.verifyEmail('');
      expect(result).toEqual({ isOK: false, error: 'Could not verify email' });
    });
  });
});
