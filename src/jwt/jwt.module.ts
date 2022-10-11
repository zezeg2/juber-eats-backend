import { DynamicModule, Module } from '@nestjs/common';
import { JwtService } from './jwt.service';

@Module({
  providers: [JwtService],
})
export class JwtModule {
  static forRoot(): DynamicModule {
    return {
      module: JwtModule,
    };
  }
}
