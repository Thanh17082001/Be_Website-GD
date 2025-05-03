import { Test, TestingModule } from '@nestjs/testing';
import { TypeParentsService } from './type-parents.service';

describe('TypeParentsService', () => {
  let service: TypeParentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeParentsService],
    }).compile();

    service = module.get<TypeParentsService>(TypeParentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
