import { DataSource } from 'typeorm';
import { Restaurant } from './entities/restaurants.entity';

export const restaurantsProviders = [
  {
    provide: 'RESTAURANTS_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Restaurant),
    inject: ['DATA_SOURCE'],
  },
];
