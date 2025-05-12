import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from 'src/products/entities/product.entity';
import { Cart } from 'src/carts/entities/cart.entity';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity()
export class CartDetail extends BaseEntity{
  @Column()
  quantity: number;

  @ManyToOne(() => Cart, (cart) => cart.details, {
    onDelete: 'CASCADE',
  })
  cart: Cart;

  @ManyToOne(() => Product, (product) => product.cartDetails, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  product: Product;
}