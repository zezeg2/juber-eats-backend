import { DataSource } from 'typeorm';
import { Restaurant } from './restaurants.entity';

export const restaurantsProvider = [
  {
    provide: 'RESTAURANTS_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Restaurant),
    inject: ['DATA_SOURCE'],
  },
];
