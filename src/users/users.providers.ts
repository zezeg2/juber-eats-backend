import { DataSource } from 'typeorm';
import { Restaurant } from '../restaurant/restaurants.entity';
import { User } from './entities/users.entity';

export const usersProviders = [
  {
    provide: 'USERS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: ['DATA_SOURCE'],
  },
];
