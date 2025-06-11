import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Hortifruit } from '../../hortifruits/entities/hortifruit.entity';
import { Category } from '../../categories/entities/category.entity';
import { CartItem } from '../../carts/entities/cart-item.entity';
import { User } from '../../users/entities/user.entity';

export enum Unit {
  KG = 'kg',
  GRAM = 'g',
  UNIT = 'un',
  LITER = 'L',
  MILLILITER = 'ml',
  PACKAGE = 'pacote',
  BOX = 'caixa',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'varchar',
    length: 10,
  })
  unit: Unit;

  @Column({ default: true })
  is_available: boolean;

  @Column({ nullable: true })
  image_url: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  stock_quantity: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discount_percentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  promotional_price: number;

  @Column({ default: false })
  featured: boolean;

  @ManyToOne(() => Hortifruit, (hortifruit) => hortifruit.products, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  hortifruit: Hortifruit;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: false,
    onDelete: 'SET NULL',
  })
  category: Category;

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cart_items: CartItem[];

  @ManyToMany(() => User, (user) => user.favoriteProducts)
  favorited_by: User[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
