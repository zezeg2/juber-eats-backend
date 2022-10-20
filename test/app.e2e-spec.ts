import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getConnection, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/users.entity';
import { AppModule } from '../src/app.module';
import { closeTestingModule, dropTables } from './test.setup_functions';
import { Verification } from '../src/users/entities/verification.entity';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';

const testUser = {
  email: 'whdgus003@las.com',
  password: '12345',
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;
  let jwtToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    await closeTestingModule();
  });

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('X-JWT', jwtToken).send({ query });

  let query: string;

  describe('createAccount', () => {
    it('should create account', () => {
      query = `
          mutation {
            createAccount(
              input: {
                email: "${testUser.email}"
                password: "${testUser.password}"
                role: Owner
              }
            ) {
              isOK
              error
            }
          }
          `;
      return publicTest(query)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.isOK).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    it('should fail if account already exists', () => {
      query = `
          mutation {
            createAccount(
              input: {
                email: "${testUser.email}"
                password: "${testUser.password}"
                role: Owner
              }
            ) {
              isOK
              error
            }
          }
          `;
      return publicTest(query)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.isOK).toBe(false);
          expect(res.body.data.createAccount.error).toBe(
            'There is a user with that email already',
          );
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      query = `
          mutation {
            login(input:{
              email:"${testUser.email}",
              password:"${testUser.password}",
            }) {
              isOK
              error
              token
            }
          }
        `;
      return publicTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.isOK).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });
    it('should not be able to login if user is not exists', () => {
      query = `
          mutation {
            login(input:{
              email:"xxxx@xxxx.com",
              password:"${testUser.password}",
            }) {
              isOK
              error
              token
            }
          }
        `;
      return publicTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.isOK).toBe(false);
          expect(login.error).toBe('Not Found User');
          expect(login.token).toBe(null);
        });
    });

    it('should not be able to login with wrong credentials', () => {
      query = `
          mutation {
            login(input:{
              email:"${testUser.email}",
              password:"xxx",
            }) {
              isOK
              error
              token
            }
          }
        `;
      return publicTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.isOK).toBe(false);
          expect(login.error).toBe('Wrong Password');
          expect(login.token).toBe(null);
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });
    it("should see user's profile", () => {
      query = `
        {
          getUserProfile(userId:${userId}){
            isOK
            error
            profile {
              id
            }
          }
        }
        `;
      return privateTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                getUserProfile: {
                  isOK,
                  error,
                  profile: { id },
                },
              },
            },
          } = res;
          expect(isOK).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });
    it('should not find a profile', () => {
      query = `
        {
          getUserProfile(userId:666){
            isOK
            error
            profile {
              id
            }
          }
        }
        `;
      return privateTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                getUserProfile: { isOK, error, profile },
              },
            },
          } = res;
          expect(isOK).toBe(false);
          expect(error).toBe('Not Found User');
          expect(profile).toBe(null);
        });
    });
  });

  describe('getLoginUserProfile', () => {
    it('should return login user profile', () => {
      query = `
        {
          getLoginUserProfile{
            isOK
            error
            profile{
              email
            }
          }
        }
        `;
      return privateTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                getLoginUserProfile: {
                  isOK,
                  error,
                  profile: { email },
                },
              },
            },
          } = res;
          expect(isOK).toBe(true);
          expect(error).toBe(null);
          expect(email).toEqual(testUser.email);
        });
    });
  });

  describe('editProfile', () => {
    const NEW_EMAIL = 'zezeg2@las.com';
    it('should change email', () => {
      query = `
        mutation{
          editProfile(input : {
            email : "${NEW_EMAIL}"
          }) {
            isOK
            error
          }
        }
        `;
      return privateTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                editProfile: { isOK, error },
              },
            },
          } = res;
          expect(isOK).toBe(true);
          expect(error).toBe(null);
        });
    });
    it('should new have new Email', () => {
      query = `
        {
          getLoginUserProfile{
            isOK
            error
            profile{
              email
            }
          }
        }
        `;
      return privateTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                getLoginUserProfile: {
                  isOK,
                  error,
                  profile: { email },
                },
              },
            },
          } = res;
          expect(isOK).toBe(true);
          expect(error).toBe(null);
          expect(email).toEqual(NEW_EMAIL);
        });
    });
  });

  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationRepository.find();
      verificationCode = verification.code;
    });

    it('should verify email', () => {
      query = `
            mutation{
              verifyEmail(input: {
                code: "${verificationCode}"
              }){
                isOK
                error
              }
            }`;
      return publicTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                verifyEmail: { isOK, error },
              },
            },
          } = res;
          expect(isOK).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should fail on wrong verification code', () => {
      query = `
        mutation{
          verifyEmail(input: {
            code: "xxxxx"
          }){
            isOK
            error
          }
        }`;
      return publicTest(query)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                verifyEmail: { isOK, error },
              },
            },
          } = res;
          expect(isOK).toBe(false);
          expect(error).toBe('Verification not found');
        });
    });
  });
});
