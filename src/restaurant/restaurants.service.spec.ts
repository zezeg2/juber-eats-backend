import { RestaurantsService } from './restaurants.service';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurants.entity';
import { Dish } from '../dish/dish.entity';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoryRepository } from './repositories/category.repository';
import { UserRole } from '../users/entities/users.entity';
import { Category } from './entities/category.entity';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
// type MockDataSource = Partial<Record<keyof DataSource, jest.Mock>>;

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  findAndCount: jest.fn(),
});

const mockCategoryRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  getOrCreate: jest.fn(),
});

describe('RestaurantService', () => {
  let service: RestaurantsService;
  let restaurantRepository: MockRepository<Restaurant>;
  let dishRepository: MockRepository<Dish>;
  let categoryRepository: Partial<Record<keyof CategoryRepository, jest.Mock>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        {
          provide: getRepositoryToken(Restaurant),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Dish),
          useValue: mockRepository(),
        },
        {
          provide: CategoryRepository,
          useValue: mockCategoryRepository(),
        },
      ],
    }).compile();
    service = module.get<RestaurantsService>(RestaurantsService);
    restaurantRepository = module.get(getRepositoryToken(Restaurant));
    dishRepository = module.get(getRepositoryToken(Dish));
    categoryRepository = module.get(CategoryRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const owner = {
    id: 1,
    email: 'owner@mail.com',
    password: 'password',
    verified: true,
    role: UserRole.Owner,
  };

  const category_1 = {
    id: 1,
    name: 'Category 1',
    slug: 'category-1',
    coverImage: 'cover-url',
  };

  const category_2 = {
    id: 2,
    name: 'Category 2',
    slug: 'category-2',
    coverImage: 'cover-url',
  };

  const categories = [category_1, category_2];

  const restaurant_1 = {
    id: 1,
    name: 'restaurant1',
    category: category_1,
    coverImage: 'url',
    address: 'address',
    ownerId: 1,
  };

  const restaurant_2 = {
    id: 2,
    name: 'restaurant2',
    category: category_1,
    coverImage: 'url',
    address: 'address',
    ownerId: 1,
  };

  const restaurants = [restaurant_1, restaurant_2];
  describe('createRestaurant', () => {
    const createRestaurantInput = {
      name: 'test-restaurant',
      categoryName: 'Category',
      coverImage: 'url',
      address: 'address',
    };

    const newRestaurant = {
      name: createRestaurantInput.name,
      coverImage: createRestaurantInput.coverImage,
      address: createRestaurantInput.address,
    };
    it('should create restaurant', async () => {
      restaurantRepository.create.mockReturnValue(newRestaurant);
      categoryRepository.getOrCreate.mockResolvedValue(category_1);
      restaurantRepository.save.mockResolvedValue({
        id: 1,
        category: category_1,
        ...newRestaurant,
      });
      const result = await service.createRestaurant(
        owner.id,
        createRestaurantInput,
      );
      expect(restaurantRepository.create).toHaveBeenCalledTimes(1);
      expect(categoryRepository.getOrCreate).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ isOK: true });
    });
    it('should fail to create restaurant if restaurant repository get rejected value', async () => {
      restaurantRepository.create.mockReturnValue(newRestaurant);
      categoryRepository.getOrCreate.mockResolvedValue(category_1);
      restaurantRepository.save.mockRejectedValue(new Error());
      const result = await service.createRestaurant(
        owner.id,
        createRestaurantInput,
      );
      expect(restaurantRepository.create).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.create).toHaveBeenCalledWith(
        createRestaurantInput,
      );
      expect(categoryRepository.getOrCreate).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        isOK: false,
        error: 'Could not create restaurant',
      });
    });
    it('should fail to create restaurant if category repository get rejected value', async () => {
      restaurantRepository.create.mockReturnValue(newRestaurant);
      categoryRepository.getOrCreate.mockRejectedValue(new Error());
      const result = await service.createRestaurant(
        owner.id,
        createRestaurantInput,
      );
      expect(restaurantRepository.create).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.create).toHaveBeenCalledWith(
        createRestaurantInput,
      );
      expect(categoryRepository.getOrCreate).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        isOK: false,
        error: 'Could not create restaurant',
      });
    });
  });
  describe('checkRestaurant', () => {
    it('should invoke error if restaurant not found', async () => {
      restaurantRepository.findOne.mockResolvedValue(undefined);
      await expect(
        async () => await service.checkRestaurant(1, 1),
      ).rejects.toThrowError();
      expect(restaurantRepository.findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw error if authUser is not same with restaurant owner', async () => {
      restaurantRepository.findOne.mockResolvedValue(restaurant_1);
      await expect(
        async () => await service.checkRestaurant(restaurant_1.id, 999),
      ).rejects.toThrowError();
      expect(restaurantRepository.findOne).toHaveBeenCalledTimes(1);
    });
  });
  describe('editRestaurant', () => {
    const editProfileArgs = {
      ownerId: owner.id,
      editRestaurantInput: {
        restaurantId: restaurant_1.id,
        name: 'new-restaurant',
        categoryName: 'New Category',
      },
    };
    it('should edit restaurant', async () => {
      const category = {
        name: 'New Category',
        slug: 'new-category',
        coverImage: 'cover-url',
      };
      restaurantRepository.findOne.mockResolvedValue(restaurant_1);
      categoryRepository.getOrCreate.mockResolvedValue(category);
      restaurantRepository.save.mockResolvedValue({
        ...restaurant_1,
        category,
      });
      const result = await service.editRestaurant(
        editProfileArgs.ownerId,
        editProfileArgs.editRestaurantInput,
      );
      expect(restaurantRepository.findOne).toHaveBeenCalledTimes(1);
      expect(categoryRepository.getOrCreate).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ isOK: true });
    });
    it('should fail if fail to check restaurant', async () => {
      jest.spyOn(service, 'checkRestaurant').mockRejectedValueOnce(new Error());
      const result = await service.editRestaurant(
        editProfileArgs.ownerId,
        editProfileArgs.editRestaurantInput,
      );
      expect(result).toEqual({ isOK: false, error: expect.any(String) });
    });
  });
  describe('deleteRestaurant', () => {
    const restaurant = { id: 1, name: 'test-restaurant' };
    const deleteProfileArgs = {
      ownerId: owner.id,
      editRestaurantInput: {
        restaurantId: 1,
      },
    };
    it('should delete restaurant', async () => {
      restaurantRepository.findOne.mockResolvedValue(restaurant_1);
      const result = await service.deleteRestaurant(
        deleteProfileArgs.ownerId,
        deleteProfileArgs.editRestaurantInput,
      );
      expect(restaurantRepository.findOne).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ isOK: true });
    });
    it('should fail if fail to check restaurant', async () => {
      jest.spyOn(service, 'checkRestaurant').mockRejectedValueOnce(new Error());
      const result = await service.deleteRestaurant(
        deleteProfileArgs.ownerId,
        deleteProfileArgs.editRestaurantInput,
      );
      expect(result).toEqual({ isOK: false, error: expect.any(String) });
    });
    it('should fail if fail to delete if repository get rejected value', async () => {
      restaurantRepository.delete.mockRejectedValue(new Error());
      const result = await service.deleteRestaurant(
        deleteProfileArgs.ownerId,
        deleteProfileArgs.editRestaurantInput,
      );
      expect(restaurantRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ isOK: false, error: expect.any(String) });
    });
  });
  describe('allCategories', () => {
    it('should get all categories', async () => {
      categoryRepository.find.mockResolvedValue(categories);
      const result = await service.allCategories();
      expect(categoryRepository.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ isOK: true, categories });
    });
    it('should fail to get categories if repository get rejected value', async () => {
      categoryRepository.find.mockRejectedValue(new Error());
      const result = await service.allCategories();
      expect(categoryRepository.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ isOK: false, error: 'Cannot load categories' });
    });
  });
  describe('countRestaurant', () => {
    it('should return a number of restaurant which category like input', async () => {
      const countRestaurantArgs = category_1.id;
      restaurantRepository.count.mockResolvedValue(1);
      const result = await service.countRestaurant(countRestaurantArgs);
      expect(restaurantRepository.count).toHaveBeenCalledTimes(1);
      expect(result).toEqual(1);
    });
  });
  describe('getCategoryBySlug', () => {
    const getCategoryBySlugArgs = {
      slug: 'category-1',
      page: 1,
    };
    it('should get category by slug with pagination', async () => {
      categoryRepository.findOne.mockResolvedValue(category_1);
      restaurantRepository.findAndCount.mockResolvedValue([restaurants, 2]);
      const result = await service.getCategoryBySlug(getCategoryBySlugArgs);
      expect(categoryRepository.findOne).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.findAndCount).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        isOK: true,
        result: { ...category_1, restaurants },
        totalCount: 2,
        totalPage: 1,
      });
    });
    it('should fail if category not found', async () => {
      categoryRepository.findOne.mockResolvedValue(undefined);
      const result = await service.getCategoryBySlug(getCategoryBySlugArgs);
      expect(result).toEqual({ isOK: false, error: 'Category Not found' });
      categoryRepository.findOne.mockResolvedValue(category_1);
    });
    it('should fail to get category if category repository get rejected value', async () => {
      categoryRepository.findOne.mockRejectedValue(new Error());
      const result = await service.getCategoryBySlug(getCategoryBySlugArgs);
      expect(result).toEqual({ isOK: false, error: 'Cannot get category' });
    });
    it('should fail to get category if restaurant repository get rejected value', async () => {
      categoryRepository.findOne.mockResolvedValue(category_1);
      restaurantRepository.findAndCount.mockRejectedValue(new Error());
      const result = await service.getCategoryBySlug(getCategoryBySlugArgs);
      expect(result).toEqual({ isOK: false, error: 'Cannot get category' });
    });
  });
  describe('allRestaurants', () => {
    const allRestaurantsArgs = { page: 1 };
    it('should get all restaurants with pagination', async () => {
      restaurantRepository.findAndCount.mockResolvedValue([restaurants, 2]);
      const result = await service.allRestaurants(allRestaurantsArgs);
      expect(result).toEqual({
        isOK: true,
        result: restaurants,
        totalCount: 2,
        totalPage: 1,
      });
    });
    it('should fail to get restaurants if repository get rejected value', async () => {
      restaurantRepository.findAndCount.mockRejectedValue(new Error());
      const result = await service.allRestaurants(allRestaurantsArgs);
      expect(result).toEqual({ isOK: false, error: 'Cannot load Restaurants' });
    });
  });
  describe('findRestaurantById', () => {
    const findRestaurantByIdArgs = { restaurantId: 1 };
    it('should find a restaurant by id', async () => {
      restaurantRepository.findOne.mockResolvedValue(restaurant_1);
      const result = await service.findRestaurantById(findRestaurantByIdArgs);
      expect(restaurantRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ isOK: true, result: restaurant_1 });
    });
    it('should fail if restaurant not found', async () => {
      restaurantRepository.findOne.mockResolvedValue(undefined);
      const result = await service.findRestaurantById(findRestaurantByIdArgs);
      expect(restaurantRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ isOK: false, error: 'Restaurant not found' });
    });
    it('should fail if repository get rejected value', async () => {
      restaurantRepository.findOne.mockRejectedValue(new Error());
      const result = await service.findRestaurantById(findRestaurantByIdArgs);
      expect(restaurantRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ isOK: false, error: 'Cannot find Restaurant' });
    });
  });
  describe('searchRestaurantByName', () => {
    const searchRestaurantByNameArgs = {
      query: 'restaurant',
      page: 1,
    };
    it('should get restaurants that name like input query with pagination', async () => {
      restaurantRepository.findAndCount.mockResolvedValue([restaurants, 2]);
      const result = await service.searchRestaurantByName(
        searchRestaurantByNameArgs,
      );
      expect(restaurantRepository.findAndCount).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        isOK: true,
        result: restaurants,
        totalCount: 2,
        totalPage: 1,
      });
    });
    it('should fail to search restaurants if repository get rejected value', async () => {
      restaurantRepository.findAndCount.mockRejectedValue(new Error());
      const result = await service.searchRestaurantByName(
        searchRestaurantByNameArgs,
      );
      expect(result).toEqual({ isOK: false, error: 'error' });
    });
  });
});
