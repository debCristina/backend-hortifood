import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartStatus } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { CreateCartItemDto } from './dtos/create-cart-item.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
  ) {}

  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: {
        user: { id: userId },
        status: 'active' as CartStatus,
      },
      relations: ['items', 'items.product', 'user'],
    });

    if (!cart) {
      const newCart = this.cartRepository.create();
      newCart.user = { id: userId } as any;
      newCart.status = 'active';
      cart = await this.cartRepository.save(newCart);
    }

    return cart;
  }

  async addItem(userId: string, createCartItemDto: CreateCartItemDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    const existingItem = cart.items?.find(
      (item) => item.product.id === createCartItemDto.productId,
    );

    try {
      if (existingItem) {
        existingItem.quantity += createCartItemDto.quantity;
        await this.cartItemRepository.save(existingItem);
      } else {
        const newItem = this.cartItemRepository.create({
          cart,
          product: { id: createCartItemDto.productId } as any,
          quantity: createCartItemDto.quantity,
        });
        await this.cartItemRepository.save(newItem);
      }

      return this.findOne(cart.id);
    } catch (error) {
      throw new BadRequestException('Erro ao adicionar item ao carrinho');
    }
  }

  async updateItem(cartItemId: string, updateCartItemDto: UpdateCartItemDto): Promise<Cart> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['cart'],
    });

    if (!cartItem) {
      throw new NotFoundException('Item do carrinho não encontrado');
    }

    try {
      if (updateCartItemDto.quantity <= 0) {
        await this.cartItemRepository.remove(cartItem);
      } else {
        cartItem.quantity = updateCartItemDto.quantity;
        await this.cartItemRepository.save(cartItem);
      }

      return this.findOne(cartItem.cart.id);
    } catch (error) {
      throw new BadRequestException('Erro ao atualizar item do carrinho');
    }
  }

  async removeItem(cartItemId: string): Promise<Cart> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['cart'],
    });

    if (!cartItem) {
      throw new NotFoundException('Item do carrinho não encontrado');
    }

    const cartId = cartItem.cart.id;
    await this.cartItemRepository.remove(cartItem);
    return this.findOne(cartId);
  }

  async findOne(id: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user'],
    });

    if (!cart) {
      throw new NotFoundException('Carrinho não encontrado');
    }

    return cart;
  }

  async findByUser(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: {
        user: { id: userId },
        status: 'active' as CartStatus,
      },
      relations: ['items', 'items.product', 'user'],
    });

    if (!cart) {
      throw new NotFoundException('Carrinho não encontrado');
    }

    return cart;
  }

  async clear(userId: string): Promise<void> {
    const cart = await this.findByUser(userId);
    if (cart.items?.length) {
      await this.cartItemRepository.remove(cart.items);
    }
  }

  async checkout(cartId: string): Promise<void> {
    const cart = await this.findOne(cartId);

    if (cart.status !== 'active') {
      throw new BadRequestException('Carrinho não está ativo');
    }

    if (!cart.items?.length) {
      throw new BadRequestException('Carrinho está vazio');
    }

    cart.status = 'completed' as CartStatus;
    await this.cartRepository.save(cart);
  }
}
