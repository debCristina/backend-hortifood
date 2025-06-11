import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Product } from '../../products/entities/product.entity';
import { Address } from '../../addresses/entities/address.entity';
import { Role } from '../../auth/enums/role.enum';

@Entity('hortifruits')
export class Hortifruit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  @Exclude()
  password: string;

  @Column()
  phone: string;

  @Column()
  document: string;

  @Column({
    type: 'varchar',
    enum: Role,
    default: Role.HORTIFRUIT
  })
  role: Role;

  @OneToOne(() => Address, { cascade: true })
  @JoinColumn()
  address: Address;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 0 })
  rating: number;

  @Column({ default: 0 })
  total_ratings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  min_order_value: number;

  @Column({ default: true })
  is_open: boolean;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ nullable: true })
  banner_url: string;

  @Column('text', { nullable: true })
  description: string;

  @OneToMany(() => Product, (product) => product.hortifruit)
  products: Product[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
