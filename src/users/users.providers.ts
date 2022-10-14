import { DataSource } from 'typeorm';
import { Restaurant } from '../restaurant/restaurants.entity';
import { User } from './entities/users.entity';
import { Verification } from './entities/verification.entity';

export const usersProviders = [
  {
    provide: 'USERS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'VERIFICATION_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Verification),
    inject: ['DATA_SOURCE'],
  },
];
