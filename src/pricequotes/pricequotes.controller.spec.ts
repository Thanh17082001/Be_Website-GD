import { Test, TestingModule } from '@nestjs/testing';
import { PricequotesController } from './pricequotes.controller';
import { PricequotesService } from './pricequotes.service';

describe('PricequotesController', () => {
  let controller: PricequotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricequotesController],
      providers: [PricequotesService],
    }).compile();

    controller = module.get<PricequotesController>(PricequotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
