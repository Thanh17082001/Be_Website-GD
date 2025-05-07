import { Inject, Injectable } from '@nestjs/common';
import { CreateMailProducerDto } from './dto/create-mail-producer.dto';
import { UpdateMailProducerDto } from './dto/update-mail-producer.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class MailProducerService {
  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
  ) {}
  async sendMail(to: string, subject: string, body: string) {
    const payload = { to, subject, body };
    this.client.emit('mail.send', payload); // Gửi message lên queue
  }

  findAll() {
    return `This action returns all mailProducer`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mailProducer`;
  }

  update(id: number, updateMailProducerDto: UpdateMailProducerDto) {
    return `This action updates a #${id} mailProducer`;
  }

  remove(id: number) {
    return `This action removes a #${id} mailProducer`;
  }
}
