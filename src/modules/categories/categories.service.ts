import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dtos/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Verifica se já existe uma categoria com o mesmo nome
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException('Já existe uma categoria com este nome');
    }

    try {
      const category = this.categoryRepository.create({
        ...createCategoryDto,
        active: createCategoryDto.active ?? true,
      });
      return await this.categoryRepository.save(category);
    } catch (error) {
      throw new BadRequestException('Erro ao criar categoria');
    }
  }

  async findAll(): Promise<Category[]> {
    try {
      return await this.categoryRepository.find({
        where: { active: true },
        order: { name: 'ASC' },
        relations: ['products'],
      });
    } catch (error) {
      throw new BadRequestException('Erro ao buscar categorias');
    }
  }

  async findOne(id: string): Promise<Category> {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id },
        relations: ['products'],
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }

      return category;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao buscar categoria');
    }
  }

  async update(id: string, updateCategoryDto: Partial<CreateCategoryDto>): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory) {
        throw new ConflictException('Já existe uma categoria com este nome');
      }
    }

    try {
      Object.assign(category, updateCategoryDto);
      return await this.categoryRepository.save(category);
    } catch (error) {
      throw new BadRequestException('Erro ao atualizar categoria');
    }
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    // Verifica se a categoria tem produtos associados
    if (category.products?.length > 0) {
      throw new BadRequestException('Não é possível remover uma categoria que possui produtos');
    }

    try {
      await this.categoryRepository.remove(category);
    } catch (error) {
      throw new BadRequestException('Erro ao remover categoria');
    }
  }

  async softDelete(id: string): Promise<void> {
    const category = await this.findOne(id);

    try {
      category.active = false;
      await this.categoryRepository.save(category);
    } catch (error) {
      throw new BadRequestException('Erro ao desativar categoria');
    }
  }

  async getPopularCategories(limit: number = 5): Promise<Category[]> {
    try {
      return await this.categoryRepository
        .createQueryBuilder('category')
        .leftJoin('category.products', 'products')
        .where('category.active = :active', { active: true })
        .addSelect('COUNT(products.id)', 'productCount')
        .groupBy('category.id')
        .orderBy('productCount', 'DESC')
        .limit(limit)
        .getMany();
    } catch (error) {
      throw new BadRequestException('Erro ao buscar categorias populares');
    }
  }
}
