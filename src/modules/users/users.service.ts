import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { hash } from 'bcryptjs';
import { User } from './entities/user.entity';
import { Address } from '../addresses/entities/address.entity';
import { Product } from '../products/entities/product.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAddressDto } from '../addresses/dtos/create-address.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, phone } = createUserDto;

    const existingUserByEmail = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Email já cadastrado');
    }

    const existingUserByPhone = await this.userRepository.findOne({
      where: { phone },
    });

    if (existingUserByPhone) {
      throw new ConflictException('Telefone já cadastrado');
    }

    const hashedPassword = await hash(createUserDto.password, 10);
    const userToCreate: DeepPartial<User> = {
      ...createUserDto,
      password: hashedPassword,
    };

    const user = this.userRepository.create(userToCreate);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['addresses', 'favoriteProducts'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['addresses', 'favoriteProducts'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true,
      },
    });
  }

  async findByEmailWithDetails(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['addresses', 'favoriteProducts'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
      const existingUser = await this.userRepository.findOne({
        where: { phone: updateUserDto.phone },
      });

      if (existingUser) {
        throw new ConflictException('Telefone já cadastrado');
      }
    }

    let updateData = { ...updateUserDto };
    delete updateData.password;

    if (updateUserDto.password) {
      updateData = {
        ...updateData,
        password: await hash(updateUserDto.password, 10),
      };
    }

    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async addAddress(userId: string, addressDto: CreateAddressDto): Promise<User> {
    const user = await this.findOne(userId);

    const address = this.addressRepository.create({
      ...addressDto,
      user,
    });

    if (addressDto.is_default) {
      // Se o novo endereço é padrão, remove o padrão dos outros
      await this.addressRepository.update(
        { user: { id: userId }, is_default: true },
        { is_default: false },
      );
    }

    await this.addressRepository.save(address);
    return this.findOne(userId);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    addressDto: CreateAddressDto,
  ): Promise<User> {
    const user = await this.findOne(userId);
    const address = await this.addressRepository.findOne({
      where: { id: addressId, user: { id: userId } },
    });

    if (!address) {
      throw new NotFoundException('Endereço não encontrado');
    }

    if (addressDto.is_default) {
      // Se o endereço atualizado é padrão, remove o padrão dos outros
      await this.addressRepository.update(
        { user: { id: userId }, is_default: true },
        { is_default: false },
      );
    }

    await this.addressRepository.update(addressId, addressDto);
    return this.findOne(userId);
  }

  async removeAddress(userId: string, addressId: string): Promise<User> {
    const user = await this.findOne(userId);
    const address = await this.addressRepository.findOne({
      where: { id: addressId, user: { id: userId } },
    });

    if (!address) {
      throw new NotFoundException('Endereço não encontrado');
    }

    await this.addressRepository.remove(address);
    return this.findOne(userId);
  }

  async addFavoriteProduct(userId: string, productId: string): Promise<User> {
    const user = await this.findOne(userId);
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (!user.favoriteProducts) {
      user.favoriteProducts = [];
    }

    const isFavorite = user.favoriteProducts.some(
      (favProduct) => favProduct.id === productId,
    );

    if (isFavorite) {
      throw new BadRequestException('Produto já está nos favoritos');
    }

    user.favoriteProducts.push(product);
    await this.userRepository.save(user);

    return this.findOne(userId);
  }

  async removeFavoriteProduct(userId: string, productId: string): Promise<User> {
    const user = await this.findOne(userId);

    if (!user.favoriteProducts) {
      throw new BadRequestException('Usuário não tem produtos favoritos');
    }

    const productIndex = user.favoriteProducts.findIndex(
      (product) => product.id === productId,
    );

    if (productIndex === -1) {
      throw new BadRequestException('Produto não está nos favoritos');
    }

    user.favoriteProducts.splice(productIndex, 1);
    await this.userRepository.save(user);

    return this.findOne(userId);
  }
}
