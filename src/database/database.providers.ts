import { DatabaseType, DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        logging: process.env.NODE_ENV !== 'production',
        synchronize: process.env.NODE_ENV !== 'production',
        entities: [__dirname + '/../**/**/*.entity{.ts,.js}'],
      });

      return dataSource.initialize();
    },
  },
];
