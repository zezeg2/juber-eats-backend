import { JwtService } from './jwt.service';
import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from '../common/common.constants';
import * as jwt from 'jsonwebtoken';

const TEST_KEY = 'test-key';
const USER_ID = 1;
let token = undefined;
jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(
      ({ id }, privateKey) =>
        'SIGNED_TOKEN_WITH ' + privateKey + ' ' + 'id: ' + id.toString(),
    ),
    verify: jest.fn((token, privateKey) => ({
      id: Number(token.split(' ')[3]),
    })),
  };
});

describe('JwtService', () => {
  let service: JwtService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: CONFIG_OPTIONS,
          useValue: { privateKey: TEST_KEY },
        },
      ],
    }).compile();
    service = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sign', () => {
    it('should return a signed token', () => {
      token = service.sign(USER_ID);
      expect(typeof token).toBe('string');
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith({ id: USER_ID }, TEST_KEY);
    });
  });

  describe('verify', () => {
    it('should return a decoded token', () => {
      const decodedToken = service.verify(token);
      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith(token, TEST_KEY);
      expect(decodedToken).toEqual({ id: USER_ID });
    });
  });
  it.todo('verify');
});
