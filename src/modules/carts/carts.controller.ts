import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CartsService } from './carts.service';
import { CreateCartItemDto } from './dtos/create-cart-item.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Cart } from './entities/cart.entity';

@ApiTags('Carrinho')
@Controller('carts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  @ApiOperation({ summary: 'Busca o carrinho ativo do usuário' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Carrinho encontrado com sucesso',
    type: Cart,
  })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  @ApiNotFoundResponse({ description: 'Carrinho não encontrado' })
  async findActiveCart(@CurrentUser('id') userId: string): Promise<Cart> {
    return this.cartsService.findByUser(userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Adiciona um item ao carrinho' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Item adicionado com sucesso',
    type: Cart,
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  async addItem(
    @CurrentUser('id') userId: string,
    @Body() createCartItemDto: CreateCartItemDto,
  ): Promise<Cart> {
    return this.cartsService.addItem(userId, createCartItemDto);
  }

  @Put('items/:id')
  @ApiOperation({ summary: 'Atualiza a quantidade de um item no carrinho' })
  @ApiParam({ name: 'id', description: 'ID do item do carrinho', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item atualizado com sucesso',
    type: Cart,
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  @ApiNotFoundResponse({ description: 'Item não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<Cart> {
    return this.cartsService.updateItem(id, updateCartItemDto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove um item do carrinho' })
  @ApiParam({ name: 'id', description: 'ID do item do carrinho', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item removido com sucesso',
    type: Cart,
  })
  @ApiNotFoundResponse({ description: 'Item não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  async removeItem(@Param('id', ParseUUIDPipe) id: string): Promise<Cart> {
    return this.cartsService.removeItem(id);
  }

  @Post('checkout/:id')
  @ApiOperation({ summary: 'Finaliza um carrinho' })
  @ApiParam({ name: 'id', description: 'ID do carrinho', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Carrinho finalizado com sucesso',
  })
  @ApiBadRequestResponse({ description: 'Carrinho vazio ou já finalizado' })
  @ApiNotFoundResponse({ description: 'Carrinho não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  async checkout(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.cartsService.checkout(id);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Limpa o carrinho ativo do usuário' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Carrinho limpo com sucesso',
  })
  @ApiNotFoundResponse({ description: 'Carrinho não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  async clear(@CurrentUser('id') userId: string): Promise<void> {
    return this.cartsService.clear(userId);
  }
}
