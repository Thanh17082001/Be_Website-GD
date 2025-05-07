import { Test, TestingModule } from '@nestjs/testing';
import { MailProducerController } from './mail-producer.controller';
import { MailProducerService } from './mail-producer.service';

describe('MailProducerController', () => {
  let controller: MailProducerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailProducerController],
      providers: [MailProducerService],
    }).compile();

    controller = module.get<MailProducerController>(MailProducerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
