import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { CategoriesModule } from '../categories/categories.module';
import { HortifruitsModule } from '../hortifruits/hortifruits.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), CategoriesModule, HortifruitsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
