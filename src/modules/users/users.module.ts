import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Address } from '@/modules/addresses/entities/address.entity';
import { Product } from '@/modules/products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Address, Product])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
