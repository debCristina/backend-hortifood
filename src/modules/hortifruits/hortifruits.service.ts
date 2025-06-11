import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { Hortifruit } from './entities/hortifruit.entity';
import { CreateHortifruitDto } from './dto/create-hortifruit.dto';
import { Address } from '../addresses/entities/address.entity';
import { PaginationDto } from '../../shared/dtos/pagination.dto';
import { CreateAddressDto } from '../addresses/dtos/create-address.dto';
import { hash } from 'bcrypt';
import { UpdateHortifruitDto } from './dto/update-hortifruit.dto';

@Injectable()
export class HortifruitsService {
  constructor(
    @InjectRepository(Hortifruit)
    private readonly hortifruitRepository: Repository<Hortifruit>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return hash(password, 12);
  }

  private async createAddress(addressData: CreateAddressDto): Promise<Address> {
    const address = this.addressRepository.create({
      ...addressData,
      type: 'store',
    });
    return this.addressRepository.save(address);
  }

  async create(createHortifruitDto: CreateHortifruitDto): Promise<Hortifruit> {
    const existingHortifruit = await this.hortifruitRepository.findOne({
      where: [{ email: createHortifruitDto.email }, { document: createHortifruitDto.document }],
    });

    if (existingHortifruit) {
      throw new ConflictException('Hortifruit já cadastrado com este email ou CNPJ');
    }

    try {
      const hashedPassword = await this.hashPassword(createHortifruitDto.password);

      // Remove o endereço do DTO para criar separadamente
      const { address: addressData, ...hortifruitData } = createHortifruitDto;

      // Cria o endereço primeiro
      let address: Address | undefined;
      if (addressData) {
        address = await this.createAddress(addressData);
      }

      // Cria o hortifruit com o endereço
      const hortifruitToCreate = this.hortifruitRepository.create({
        ...hortifruitData,
        password: hashedPassword,
        address,
      });

      // Salva o hortifruit
      return await this.hortifruitRepository.save(hortifruitToCreate);
    } catch (error) {
      throw new BadRequestException('Erro ao criar hortifruit: ' + error.message);
    }
  }

  async findAll(paginationDto?: PaginationDto): Promise<{ data: Hortifruit[]; total: number }> {
    const { page = 1, limit = 10, ...filters } = paginationDto || {};
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Hortifruit> = {};

    // Aplica filtros se fornecidos
    if (filters.search) {
      where.name = filters.search;
    }

    if (filters.isOpen !== undefined) {
      where.is_open = filters.isOpen;
    }

    if (filters.minRating) {
      where.rating = Between(filters.minRating, 5);
    }

    const [hortifruits, total] = await this.hortifruitRepository.findAndCount({
      where,
      relations: ['products', 'address'],
      order: { name: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data: hortifruits,
      total,
    };
  }

  async findOne(id: string): Promise<Hortifruit> {
    const hortifruit = await this.hortifruitRepository.findOne({
      where: { id },
      relations: ['products', 'address'],
    });

    if (!hortifruit) {
      throw new NotFoundException('Hortifruit não encontrado');
    }

    return hortifruit;
  }

  async findByEmail(email: string): Promise<Hortifruit> {
    const hortifruit = await this.hortifruitRepository.findOne({
      where: { email },
      relations: ['products', 'address'],
    });

    if (!hortifruit) {
      throw new NotFoundException('Hortifruit não encontrado');
    }

    return hortifruit;
  }

  async findByEmailWithPassword(email: string): Promise<Hortifruit | null> {
    console.log('Finding hortifruit by email:', email);
    const hortifruit = await this.hortifruitRepository
      .createQueryBuilder('hortifruit')
      .where('hortifruit.email = :email', { email })
      .addSelect('hortifruit.password')
      .leftJoinAndSelect('hortifruit.products', 'products')
      .leftJoinAndSelect('hortifruit.address', 'address')
      .getOne();

    console.log('Found hortifruit:', hortifruit ? {
      ...hortifruit,
      password: hortifruit.password ? 'exists' : 'not exists'
    } : null);

    return hortifruit;
  }

  async update(id: string, updateHortifruitDto: UpdateHortifruitDto): Promise<Hortifruit> {
    const hortifruit = await this.findOne(id);

    if (updateHortifruitDto.email && updateHortifruitDto.email !== hortifruit.email) {
      const existingHortifruit = await this.hortifruitRepository.findOne({
        where: { email: updateHortifruitDto.email },
      });

      if (existingHortifruit) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    if (updateHortifruitDto.document && updateHortifruitDto.document !== hortifruit.document) {
      const existingHortifruit = await this.hortifruitRepository.findOne({
        where: { document: updateHortifruitDto.document },
      });

      if (existingHortifruit) {
        throw new ConflictException('CNPJ já cadastrado');
      }
    }

    try {
      const updateData = { ...updateHortifruitDto };

      // Se houver nova senha, faz o hash
      if (updateData.password) {
        updateData.password = await this.hashPassword(updateData.password);
      }

      // Se houver atualização de endereço
      if (updateData.address) {
        if (hortifruit.address) {
          // Atualiza o endereço existente
          await this.addressRepository.update(hortifruit.address.id, {
            ...updateData.address,
            type: 'store',
          });
        } else {
          // Cria um novo endereço
          hortifruit.address = await this.createAddress(updateData.address);
        }
        delete updateData.address;
      }

      // Atualiza os dados do hortifruit
      await this.hortifruitRepository.update(id, updateData);
      return this.findOne(id);
    } catch (error) {
      throw new BadRequestException('Erro ao atualizar hortifruit: ' + error.message);
    }
  }

  async remove(id: string): Promise<void> {
    const hortifruit = await this.findOne(id);
    await this.hortifruitRepository.remove(hortifruit);
  }

  async updateOperatingStatus(id: string, isOpen: boolean): Promise<Hortifruit> {
    const hortifruit = await this.findOne(id);
    await this.hortifruitRepository.update(id, { is_open: isOpen });
    return this.findOne(id);
  }

  async addRating(id: string, rating: number): Promise<Hortifruit> {
    const hortifruit = await this.findOne(id);
    
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('A avaliação deve estar entre 1 e 5');
    }

    const newTotalRatings = hortifruit.total_ratings + 1;
    const newRating = ((hortifruit.rating * hortifruit.total_ratings) + rating) / newTotalRatings;

    await this.hortifruitRepository.update(id, {
      rating: newRating,
      total_ratings: newTotalRatings,
    });

    return this.findOne(id);
  }
}
