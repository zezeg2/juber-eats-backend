import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { TYPEORM_EX_CUSTOM_REPOSITORY } from './extends-repository.decorator';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Global()
@Module({})
export class ExtendsRepositoryModule {
  public static forCustomRepository<T extends new (...args: any[]) => any>(
    repositories: T[],
  ): DynamicModule {
    const providers: Provider[] = [];

    for (const repository of repositories) {
      const entity = Reflect.getMetadata(
        TYPEORM_EX_CUSTOM_REPOSITORY,
        repository,
      );

      if (!entity) {
        continue;
      }

      providers.push({
        inject: [getDataSourceToken()],
        provide: repository,
        useFactory: (dataSource: DataSource): typeof repository => {
          const baseRepository = dataSource.getRepository<any>(entity);
          return new repository(
            baseRepository.target,
            baseRepository.manager,
            baseRepository.queryRunner,
          );
        },
      });
    }

    return {
      exports: providers,
      module: ExtendsRepositoryModule,
      providers,
    };
  }
}
