import { Test, TestingModule } from '@nestjs/testing';
import { CartDetailService } from './cart-detail.service';

describe('CartDetailService', () => {
  let service: CartDetailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartDetailService],
    }).compile();

    service = module.get<CartDetailService>(CartDetailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
