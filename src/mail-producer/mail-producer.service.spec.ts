import { Test, TestingModule } from '@nestjs/testing';
import { MailProducerService } from './mail-producer.service';

describe('MailProducerService', () => {
  let service: MailProducerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailProducerService],
    }).compile();

    service = module.get<MailProducerService>(MailProducerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
