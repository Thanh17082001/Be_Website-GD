import { Test, TestingModule } from '@nestjs/testing';
import { PricequoteDetailsController } from './pricequote-details.controller';
import { PricequoteDetailsService } from './pricequote-details.service';

describe('PricequoteDetailsController', () => {
  let controller: PricequoteDetailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricequoteDetailsController],
      providers: [PricequoteDetailsService],
    }).compile();

    controller = module.get<PricequoteDetailsController>(PricequoteDetailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
