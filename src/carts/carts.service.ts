import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { instanceToPlain } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Repository } from 'typeorm';
import { CartDetail } from 'src/cart-detail/entities/cart-detail.entity';
import { User } from 'src/users/entities/user.entity';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart) private repo: Repository<Cart>,
    @InjectRepository(CartDetail) private cartDetailRepo: Repository<CartDetail>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) { }
  async addToCart(createCartDto: CreateCartDto, user: User) {
    let cart = await this.repo.findOne({
      where: { createdBy: { id: user.id } },
    });

    // Nếu chưa có giỏ hàng, tạo mới
    if (!cart) {
      cart = this.repo.create({ createdBy: user });
      cart = await this.repo.save(cart);
    }

    for (const item of createCartDto.details) {
      const product = await this.productRepo.findOneBy({ id: item.productId });
      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }

      // Kiểm tra CartDetail đã tồn tại chưa
      let cartDetail = await this.cartDetailRepo.findOne({
        where: {
          cart: { id: cart.id },
          product: { id: product.id },
        },
        relations: ['cart', 'product'],
      });

      if (cartDetail) {
        // Nếu có => tăng số lượng
        cartDetail.quantity += item.quantity;
      } else {
        // Nếu chưa => tạo mới
        cartDetail = this.cartDetailRepo.create({
          cart,
          product,
          quantity: item.quantity,
        });
      }

      // Lưu lại CartDetail (dù là update hay tạo mới)
      await this.cartDetailRepo.save(cartDetail);
    }

    return this.repo.findOne({
      where: { id: cart.id },
      relations: ['details', 'details.product'],
    });
  }
  findAll() {
    return `This action returns all carts`;
  }

  async findOne(id: number) {
    const cart = await this.repo.findOne({
      where: { createdBy: {id} },  // Tìm theo userId (hoặc thay đổi điều kiện khác)
      relations: ['details', 'details.product'],  // Nếu muốn lấy details và product trong Cart
    });

    if (!cart) {
      throw new NotFoundException(`Cart for user with ID ${id} not found`);
    }

    return cart;
  }

  update(id: number, updateCartDto: UpdateCartDto) {
    return `This action updates a #${id} cart`;
  }

  remove(id: number) {
    return `This action removes a #${id} cart`;
  }
}
