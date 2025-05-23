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
      where: { createdBy: { id } },
      relations: ['details', 'details.product'],  // Bao gồm details và product
    });

    if (!cart) {
      throw new NotFoundException(`Cart for user with ID ${id} not found`);
    }
    return cart;
  }
  async decreaseProductQuantity(updateCartDto: UpdateCartDto, user: User) {
    const { productId } = updateCartDto;
    // console.log(productId)
    // console.log(user)
    const cart = await this.repo.findOne({
      where: { createdBy: { id: user.id } },
      relations: ['details', 'details.product'],
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const cartDetail = cart.details.find(detail => detail.product.id === productId);

    if (!cartDetail) {
      throw new NotFoundException(`Product with ID ${productId} not found in cart`);
    }

    if (cartDetail.quantity > 1) {
      cartDetail.quantity -= 1;
      await this.cartDetailRepo.save(cartDetail);
    }

    return this.repo.findOne({
      where: { id: cart.id },
      relations: ['details', 'details.product'],
    });
  }
  async increaseProductQuantity(updateCartDto: UpdateCartDto, user: User) {
    const { productId } = updateCartDto;

    const cart = await this.repo.findOne({
      where: { createdBy: { id: user.id } },
      relations: ['details', 'details.product'],
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const cartDetail = cart.details.find(detail => detail.product.id === productId);

    if (!cartDetail) {
      throw new NotFoundException(`Product with ID ${productId} not found in cart`);
    }

    // Tăng số lượng
    cartDetail.quantity += 1;
    await this.cartDetailRepo.save(cartDetail);

    return this.repo.findOne({
      where: { id: cart.id },
      relations: ['details', 'details.product'],
    });
  }
  async removeProductFromCart(updateCartDto: UpdateCartDto, user: User) {
    const { productId } = updateCartDto;

    const cart = await this.repo.findOne({
      where: { createdBy: { id: user.id } },
      relations: ['details', 'details.product'],
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const cartDetail = cart.details.find(detail => detail.product.id === productId);

    if (!cartDetail) {
      throw new NotFoundException(`Product with ID ${productId} not found in cart`);
    }

    // Xóa cartDetail
    await this.cartDetailRepo.remove(cartDetail);

    return this.repo.findOne({
      where: { id: cart.id },
      relations: ['details', 'details.product'],
    });
  }
}
