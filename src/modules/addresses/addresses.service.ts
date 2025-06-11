import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dtos/create-address.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';
import { User } from '@/modules/users/entities/user.entity';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userId: string, createAddressDto: CreateAddressDto): Promise<Address> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['addresses'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Se for o primeiro endereço, define como padrão
    const isDefault = user.addresses.length === 0;

    const address = this.addressRepository.create({
      ...createAddressDto,
      user,
      is_default: isDefault,
      type: createAddressDto.type || 'home',
    });

    return this.addressRepository.save(address);
  }

  async findAllByUser(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: { user: { id: userId } },
      order: {
        is_default: 'DESC',
        created_at: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!address) {
      throw new NotFoundException('Endereço não encontrado');
    }

    return address;
  }

  async update(id: string, updateAddressDto: UpdateAddressDto): Promise<Address> {
    const address = await this.findOne(id);

    const updatedAddress = this.addressRepository.create({
      ...address,
      ...updateAddressDto,
    });

    return this.addressRepository.save(updatedAddress);
  }

  async remove(id: string): Promise<void> {
    const address = await this.findOne(id);
    await this.addressRepository.remove(address);
  }

  async setDefault(userId: string, addressId: string): Promise<Address> {
    // Remove o status de padrão de todos os endereços do usuário
    await this.addressRepository.update({ user: { id: userId } }, { is_default: false });

    // Define o novo endereço padrão
    const address = await this.findOne(addressId);
    address.is_default = true;

    return this.addressRepository.save(address);
  }
}
