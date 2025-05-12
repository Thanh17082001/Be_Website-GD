import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Public } from 'src/auth/auth.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  // @Public()
  addToCart(@Body() createCartDto: CreateCartDto, @Req() request: Request,) {
    const user: User = request['user'];
    return this.cartsService.addToCart(createCartDto, user);
  }

  @Get()
  findAll() {
    return this.cartsService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.cartsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
    return this.cartsService.update(+id, updateCartDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartsService.remove(+id);
  }
}
