import { Test, TestingModule } from '@nestjs/testing';
import { PricequoteDetailsService } from './pricequote-details.service';

describe('PricequoteDetailsService', () => {
  let service: PricequoteDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricequoteDetailsService],
    }).compile();

    service = module.get<PricequoteDetailsService>(PricequoteDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
