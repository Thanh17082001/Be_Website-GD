import { Test, TestingModule } from '@nestjs/testing';
import { PricequotesService } from './pricequotes.service';

describe('PricequotesService', () => {
  let service: PricequotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricequotesService],
    }).compile();

    service = module.get<PricequotesService>(PricequotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
