import { Test, TestingModule } from '@nestjs/testing';
import { CartDetailController } from './cart-detail.controller';
import { CartDetailService } from './cart-detail.service';

describe('CartDetailController', () => {
  let controller: CartDetailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartDetailController],
      providers: [CartDetailService],
    }).compile();

    controller = module.get<CartDetailController>(CartDetailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
