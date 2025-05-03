import { Test, TestingModule } from '@nestjs/testing';
import { TypeParentsController } from './type-parents.controller';
import { TypeParentsService } from './type-parents.service';

describe('TypeParentsController', () => {
  let controller: TypeParentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TypeParentsController],
      providers: [TypeParentsService],
    }).compile();

    controller = module.get<TypeParentsController>(TypeParentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
