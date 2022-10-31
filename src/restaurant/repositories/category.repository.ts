import { Category } from '../entities/category.entity';
import { DataSource } from 'typeorm';

export const CategoryRepository = (dataSource: DataSource) => {
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
};
