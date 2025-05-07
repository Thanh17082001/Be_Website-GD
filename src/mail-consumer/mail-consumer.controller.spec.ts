import { Test, TestingModule } from '@nestjs/testing';
import { MailConsumerController } from './mail-consumer.controller';

describe('MailConsumerController', () => {
  let controller: MailConsumerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailConsumerController],
    }).compile();

    controller = module.get<MailConsumerController>(MailConsumerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
