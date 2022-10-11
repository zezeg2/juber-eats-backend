import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { usersProviders } from './users.providers';
import { DatabaseModule } from '../database/database.module';
import { UsersResolver } from './users.resolver';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService, UsersResolver, ...usersProviders],
  exports: [UsersService],
})
export class UsersModule {}