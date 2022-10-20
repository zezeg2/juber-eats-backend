import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getConnection, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/users.entity';
import { AppModule } from '../src/app.module';
import { closeTestingModule, dropTables } from './test.setup_functions';

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
  let jwtToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    await app.init();
  });

  afterAll(async () => {
    await closeTestingModule();
  });

  describe('createAccount', () => {
    it('should create account', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
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
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.isOK).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    it('should fail if account already exists', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
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
          `,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
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
        `,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
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
        `,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
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
        `,
        })
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
    it("should see a user's profile", () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
        {
          getUserProfile(userId:${userId}){
            isOK
            error
            profile {
              id
            }
          }
        }
        `,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
        {
          getUserProfile(userId:666){
            isOK
            error
            profile {
              id
            }
          }
        }
        `,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
        {
          getLoginUserProfile{
            isOK
            error
            profile{
              email
            }
          }
        }
        `,
        })
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
    it('should change email', () => {
      const NEW_EMAIL = 'zezeg2@las.com';
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
            mutation{
              editProfile(input : {
                email : "${NEW_EMAIL}"
              }) {
                isOK
                error
              }
            }
            `,
        })
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
        })
        .then(() => {
          return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .set('X-JWT', jwtToken)
            .send({
              query: `
        {
          getLoginUserProfile{
            isOK
            error
            profile{
              email
            }
          }
        }
        `,
            })
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
  });

  it.todo('verifyEmail');
});
