import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { RestaurantsModule } from './restaurant/restaurants.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import * as Joi from 'joi';
import { JwtModule } from './jwt/jwt.module';
import { MailModule } from './mail/mail.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/users.entity';
import { Verification } from './users/entities/verification.entity';
import { Restaurant } from './restaurant/entities/restaurants.entity';
import { Category } from './restaurant/entities/category.entity';
import { AuthModule } from './auth/auth.module';
import { DataSource } from 'typeorm';
import { Dish } from './dish/dish.entity';
import { DishModule } from './dish/dish.module';
import { OrderModule } from './order/orders.module';
import { Order } from './order/entities/order.entity';
import { OrderDish } from './order/entities/order-dish.entity';
import { Context } from 'graphql-ws';
import { CommonModule } from './common/common.module';
import { PaymentModule } from './payment/payment.module';
import { Payment } from './payment/entities/payment.entity';
import { ScheduleModule } from '@nestjs/schedule';

const TOKEN_KEY = 'x-jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
      ignoreEnvFile: process.env.NODE_ENV === 'prod',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'test', 'prod').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        PRIVATE_KEY: Joi.string().required(),
        MAILGUN_API_KEY: Joi.string().required(),
        MAILGUN_DOMAIN_NAME: Joi.string().required(),
        MAILGUN_FROM_EMAIL: Joi.string().required(),
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      subscriptions: {
        'graphql-ws': {
          onConnect: (context: Context<any, any>) => {
            const { connectionParams, extra } = context;
            extra.token = connectionParams[TOKEN_KEY];
          },
        },
      },
      driver: ApolloDriver,
      autoSchemaFile: true,
      context: ({ req, extra }) => {
        return { token: req ? req.headers[TOKEN_KEY] : extra.token };
      },
    }),
    RestaurantsModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      logging: process.env.NODE_ENV === 'dev',
      synchronize: process.env.NODE_ENV !== 'prod',
      // entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      entities: [
        User,
        Verification,
        Restaurant,
        Category,
        Dish,
        Order,
        OrderDish,
        Payment,
      ],
    }),
    ScheduleModule.forRoot(),
    CommonModule,
    UsersModule,
    JwtModule.forRoot({
      privateKey: process.env.PRIVATE_KEY,
    }),
    MailModule.forRoot({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN_NAME,
      fromEmail: process.env.MAILGUN_FROM_EMAIL,
    }),
    AuthModule,
    DishModule,
    OrderModule,
    PaymentModule,
  ],
  controllers: [],
  providers: [],
})
// export class AppModule implements NestModule {
//   constructor(private dataSource: DataSource) {}
//   configure(consumer: MiddlewareConsumer): any {
//     consumer
//       .apply(JwtMiddleware) //.exclude()
//       .forRoutes({ path: '*', method: RequestMethod.ALL });
//   }
// }
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
