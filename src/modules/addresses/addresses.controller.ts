import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dtos/create-address.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { RequiresType } from '@/modules/auth/decorators/requires-type.decorator';
import { UpdateAddressDto } from './dtos/update-address.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
    type: 'user' | 'hortifruit';
  };
}

@ApiTags('addresses')
@Controller('addresses')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @RequiresType('user')
  @ApiOperation({ summary: 'Criar um novo endereço para o usuário' })
  @ApiResponse({ status: 201, description: 'Endereço criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Request() req: AuthenticatedRequest, @Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(req.user.id, createAddressDto);
  }

  @Get()
  @RequiresType('user')
  @ApiOperation({ summary: 'Listar endereços do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de endereços' })
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.addressesService.findAllByUser(req.user.id);
  }

  @Get(':id')
  @RequiresType('user')
  @ApiOperation({ summary: 'Buscar um endereço específico' })
  @ApiResponse({ status: 200, description: 'Endereço encontrado' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async findOne(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const address = await this.addressesService.findOne(id);

    // Verifica se o endereço pertence ao usuário
    if (address.user?.id !== req.user.id) {
      throw new ForbiddenException('Você não tem permissão para acessar este endereço');
    }

    return address;
  }

  @Patch(':id')
  @RequiresType('user')
  @ApiOperation({ summary: 'Atualizar um endereço' })
  @ApiResponse({ status: 200, description: 'Endereço atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    const address = await this.addressesService.findOne(id);

    // Verifica se o endereço pertence ao usuário
    if (address.user?.id !== req.user.id) {
      throw new ForbiddenException('Você não tem permissão para atualizar este endereço');
    }

    return this.addressesService.update(id, updateAddressDto);
  }

  @Delete(':id')
  @RequiresType('user')
  @ApiOperation({ summary: 'Remover um endereço' })
  @ApiResponse({ status: 200, description: 'Endereço removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async remove(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const address = await this.addressesService.findOne(id);

    // Verifica se o endereço pertence ao usuário
    if (address.user?.id !== req.user.id) {
      throw new ForbiddenException('Você não tem permissão para remover este endereço');
    }

    // Não permite remover o endereço padrão se houver outros endereços
    if (address.is_default) {
      const userAddresses = await this.addressesService.findAllByUser(req.user.id);
      if (userAddresses.length > 1) {
        throw new ForbiddenException('Defina outro endereço como padrão antes de remover este');
      }
    }

    return this.addressesService.remove(id);
  }

  @Patch(':id/default')
  @RequiresType('user')
  @ApiOperation({ summary: 'Definir endereço como padrão' })
  @ApiResponse({ status: 200, description: 'Endereço definido como padrão com sucesso' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async setDefault(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const address = await this.addressesService.findOne(id);

    // Verifica se o endereço pertence ao usuário
    if (address.user?.id !== req.user.id) {
      throw new ForbiddenException('Você não tem permissão para modificar este endereço');
    }

    return this.addressesService.setDefault(req.user.id, id);
  }
}
