import { Module } from '@nestjs/common';
import { MailProducerService } from './mail-producer.service';
import { MailProducerController } from './mail-producer.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'],
          queue: process.env.RABBITMQ_QUEUE || 'mail_queue',
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  controllers: [MailProducerController],
  providers: [MailProducerService],
  exports: [MailProducerService],
})
export class MailProducerModule {}
