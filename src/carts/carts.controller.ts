import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Public } from 'src/auth/auth.decorator';
import { User } from 'src/users/entities/user.entity';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';

@Controller('carts')
@UseGuards(AuthGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) { }

  @Post()
  @Roles(Role.ADMIN, Role.CUSTOMER)
  addToCart(@Body() createCartDto: CreateCartDto, @Req() request: Request,) {
    const user: User = request['user'];
    return this.cartsService.addToCart(createCartDto, user);
  }

  @Get()
  findAll() {
    return this.cartsService.findAll();
  }

  @Get('decreasequantity')
  @Roles(Role.ADMIN, Role.CUSTOMER)
  decreaseProductQuantity(@Body() updateCartDto: UpdateCartDto, @Req() request: Request) {
    const user: User = request['user'];
    return this.cartsService.decreaseProductQuantity(updateCartDto, user);
  }
  @Get('increasequantity')
  @Roles(Role.ADMIN, Role.CUSTOMER)
  increaseProductQuantity(@Body() updateCartDto: UpdateCartDto, @Req() request: Request) {
    const user: User = request['user'];
    return this.cartsService.increaseProductQuantity(updateCartDto, user);
  }
  @Get(':id')
  @Roles(Role.ADMIN, Role.CUSTOMER)
  findOne(@Param('id') id: string) {
    return this.cartsService.findOne(+id);
  }

  @Delete('deleteproduct')
  @Roles(Role.ADMIN, Role.CUSTOMER)
  removeProductFromCart(@Body() updateCartDto: UpdateCartDto, @Req() request: Request) {
    const user: User = request['user'];
    return this.cartsService.removeProductFromCart(updateCartDto, user);
  }
}
