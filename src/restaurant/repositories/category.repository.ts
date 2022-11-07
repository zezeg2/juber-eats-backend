import { Category } from '../entities/category.entity';
import { DataSource, Repository } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { ExtendsRepository } from '../../common/extends-repository.decorator';

// export const CategoryRepository = (dataSource: DataSource) => {
//   return dataSource.getRepository(Category).extend({
//     async getOrCreate(name: string): Promise<Category> {
//       const categoryName = name.trim().toLowerCase();
//       const categorySlug = categoryName.replace(/ /g, '-');
//       let category = await this.findOne({
//         where: { slug: categorySlug },
//       });
//       if (!category) {
//         category = await this.save(
//           this.create({
//             slug: categorySlug,
//             name: categoryName,
//           }),
//         );
//       }
//       return category;
//     },
//   });
// };

export const CategoryRepositoryProvider = {
  provide: 'CUSTOM_CATEGORY_REPOSITORY',
  inject: [getDataSourceToken()],
  useFactory: async (dataSource: DataSource) => {
    return dataSource.getRepository(Category).extend({
      async getOrCreate(name: string): Promise<Category> {
        const categoryName = name.trim().toLowerCase();
        const categorySlug = categoryName.replace(/ /g, '-');
        let category = await this.findOne({
          where: { slug: categorySlug },
        });
        if (!category) {
          category = await this.save(
            this.create({
              slug: categorySlug,
              name: categoryName,
            }),
          );
        }
        return category;
      },
    });
  },
};

@ExtendsRepository(Category)
export class CategoryRepository extends Repository<Category> {
  async getOrCreate(name: string): Promise<Category> {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');
    let category = await this.findOne({
      where: { slug: categorySlug },
    });
    if (!category) {
      category = await this.save(
        this.create({
          slug: categorySlug,
          name: categoryName,
        }),
      );
    }
    return category;
  }
}
