import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { Product, Unit } from '../entities/product.entity';
import { PaginationDto, PaginatedResult } from '@/shared/dtos/pagination.dto';
import { CategoriesService } from '@/modules/categories/categories.service';
import { HortifruitsService } from '@/modules/hortifruits/hortifruits.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly categoriesService: CategoriesService,
    private readonly hortifruitsService: HortifruitsService,
  ) {}

  private validateUnit(unit: string): void {
    if (!Object.values(Unit).includes(unit as Unit)) {
      throw new BadRequestException(
        `Unidade inválida. Valores permitidos: ${Object.values(Unit).join(', ')}`,
      );
    }
  }

  private validatePrice(price: number): void {
    if (price < 0) {
      throw new BadRequestException('O preço não pode ser negativo');
    }
  }

  private validateStockQuantity(quantity: number): void {
    if (quantity < 0) {
      throw new BadRequestException('A quantidade em estoque não pode ser negativa');
    }
  }

  private validateDiscountPercentage(percentage: number): void {
    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('A porcentagem de desconto deve estar entre 0 e 100');
    }
  }

  private calculatePromotionalPrice(price: number, discountPercentage: number): number {
    return Number((price * (1 - discountPercentage / 100)).toFixed(2));
  }

  async create(hortifruitId: string, createProductDto: CreateProductDto): Promise<Product> {
    // Validar existência do hortifruit
    await this.hortifruitsService.findOne(hortifruitId);

    // Validar existência da categoria
    await this.categoriesService.findOne(createProductDto.category_id);

    // Validações dos campos
    this.validateUnit(createProductDto.unit);
    this.validatePrice(createProductDto.price);
    this.validateStockQuantity(createProductDto.stock_quantity);

    if (createProductDto.discount_percentage !== undefined) {
      this.validateDiscountPercentage(createProductDto.discount_percentage);
      createProductDto.promotional_price = this.calculatePromotionalPrice(
        createProductDto.price,
        createProductDto.discount_percentage,
      );
    }

    try {
      const product = this.productRepository.create({
        ...createProductDto,
        hortifruit: { id: hortifruitId },
        category: { id: createProductDto.category_id },
        is_available: true,
      });

      return await this.productRepository.save(product);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Já existe um produto com este nome neste hortifruit');
      }
      throw new BadRequestException('Erro ao criar produto');
    }
  }

  async findAll(
    hortifruitId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Product>> {
    const { page = 1, limit = 10, search, sort = 'created_at', order = 'DESC' } = paginationDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.hortifruit', 'hortifruit')
      .where('product.hortifruit.id = :hortifruitId', { hortifruitId });

    if (search) {
      queryBuilder.andWhere('(product.name ILIKE :search OR product.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const total = await queryBuilder.getCount();
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const items = await queryBuilder
      .orderBy(`product.${sort}`, order)
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: {
        category: true,
        hortifruit: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async update(
    id: string,
    hortifruitId: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    if (product.hortifruit.id !== hortifruitId) {
      throw new UnauthorizedException('Você não tem permissão para atualizar este produto');
    }

    // Validações
    if (updateProductDto.unit) {
      this.validateUnit(updateProductDto.unit);
    }

    if (updateProductDto.price !== undefined) {
      this.validatePrice(updateProductDto.price);
    }

    if (updateProductDto.stock_quantity !== undefined) {
      this.validateStockQuantity(updateProductDto.stock_quantity);
    }

    if (updateProductDto.discount_percentage !== undefined) {
      this.validateDiscountPercentage(updateProductDto.discount_percentage);
      updateProductDto.promotional_price = this.calculatePromotionalPrice(
        updateProductDto.price ?? product.price,
        updateProductDto.discount_percentage,
      );
    }

    if (updateProductDto.category_id) {
      await this.categoriesService.findOne(updateProductDto.category_id);
    }

    try {
      Object.assign(product, {
        ...updateProductDto,
        category: updateProductDto.category_id
          ? { id: updateProductDto.category_id }
          : product.category,
      });

      return await this.productRepository.save(product);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Já existe um produto com este nome neste hortifruit');
      }
      throw new BadRequestException('Erro ao atualizar produto');
    }
  }

  async remove(id: string, hortifruitId: string): Promise<void> {
    const product = await this.findOne(id);

    if (product.hortifruit.id !== hortifruitId) {
      throw new UnauthorizedException('Você não tem permissão para remover este produto');
    }

    await this.productRepository.remove(product);
  }

  async toggleAvailability(id: string, hortifruitId: string): Promise<Product> {
    const product = await this.findOne(id);

    if (product.hortifruit.id !== hortifruitId) {
      throw new UnauthorizedException('Você não tem permissão para alterar este produto');
    }

    product.is_available = !product.is_available;
    return await this.productRepository.save(product);
  }

  async toggleFeatured(id: string, hortifruitId: string): Promise<Product> {
    const product = await this.findOne(id);

    if (product.hortifruit.id !== hortifruitId) {
      throw new UnauthorizedException('Você não tem permissão para alterar este produto');
    }

    product.featured = !product.featured;
    return await this.productRepository.save(product);
  }

  async findByCategory(
    categoryId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Product>> {
    const { page = 1, limit = 10, search } = paginationDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.hortifruit', 'hortifruit')
      .where('category.id = :categoryId', { categoryId });

    if (search) {
      queryBuilder.andWhere('(product.name ILIKE :search OR product.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const total = await queryBuilder.getCount();
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const items = await queryBuilder.skip(skip).take(limit).getMany();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findFeaturedProducts(hortifruitId: string, limit: number = 10): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.hortifruit.id = :hortifruitId', { hortifruitId })
      .andWhere('product.is_available = true')
      .andWhere('product.featured = true')
      .orderBy('product.created_at', 'DESC')
      .take(limit)
      .getMany();
  }
}
