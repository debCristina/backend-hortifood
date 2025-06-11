import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hortifruit } from './entities/hortifruit.entity';
import { HortifruitsService } from './hortifruits.service';
import { Address } from '@/modules/addresses/entities/address.entity';
import { HortifruitsController } from './hortifruits.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Hortifruit, Address])],
  controllers: [HortifruitsController],
  providers: [HortifruitsService],
  exports: [HortifruitsService],
})
export class HortifruitsModule {}
