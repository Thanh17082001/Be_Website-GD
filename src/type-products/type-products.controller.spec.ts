import { Test, TestingModule } from '@nestjs/testing';
import { TypeProductsController } from './type-products.controller';
import { TypeProductsService } from './type-products.service';

describe('TypeProductsController', () => {
  let controller: TypeProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TypeProductsController],
      providers: [TypeProductsService],
    }).compile();

    controller = module.get<TypeProductsController>(TypeProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
