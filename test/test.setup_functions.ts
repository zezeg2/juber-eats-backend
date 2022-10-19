import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

let app: INestApplication;

export async function createTestingModule() {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = module.createNestApplication(undefined, {
    logger: false,
  });

  await app.init();
  return module;
}

export async function closeTestingModule() {
  await dropTables();
  if (app) await app.close();
}

export function getTestingModule() {
  if (!app) throw 'No app was initialized';
  return app;
}

export async function dropTables() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const connection = await dataSource.initialize();
  await connection.dropDatabase();
  await connection.destroy();
}
