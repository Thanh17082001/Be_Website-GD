import { Test, TestingModule } from '@nestjs/testing';
import { TypeProductsService } from './type-products.service';

describe('TypeProductsService', () => {
  let service: TypeProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeProductsService],
    }).compile();

    service = module.get<TypeProductsService>(TypeProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
