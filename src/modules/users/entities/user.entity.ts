import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Address } from '../../addresses/entities/address.entity';
import { Cart } from '../../carts/entities/cart.entity';
import { Product } from '../../products/entities/product.entity';
import { Hortifruit } from '../../hortifruits/entities/hortifruit.entity';
import { Role } from '../../auth/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  @Exclude()
  password: string;

  @Column({ unique: true })
  phone: string;

  @Column({
    type: 'varchar',
    enum: Role,
    default: Role.USER
  })
  role: Role;

  @OneToMany(() => Address, address => address.user)
  addresses: Address[];

  @OneToMany(() => Cart, cart => cart.user)
  carts: Cart[];

  @ManyToMany(() => Product)
  @JoinTable({
    name: 'user_favorite_products',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'product_id',
      referencedColumnName: 'id',
    },
  })
  favoriteProducts: Product[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
