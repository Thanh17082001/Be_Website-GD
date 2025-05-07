import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MailProducerService } from './mail-producer.service';
import { CreateMailProducerDto } from './dto/create-mail-producer.dto';
import { UpdateMailProducerDto } from './dto/update-mail-producer.dto';

@Controller('mail-producer')
export class MailProducerController {
  constructor(private readonly mailProducerService: MailProducerService) {}

  @Post()
  async sendMail(
    @Body() body: { to: string; subject: string; body: string },
  ) {
    await this.mailProducerService.sendMail(body.to, body.subject, body.body);
    return { message: 'Email task pushed to queue 🎯' };
  }

  @Get()
  findAll() {
    return this.mailProducerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mailProducerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMailProducerDto: UpdateMailProducerDto) {
    return this.mailProducerService.update(+id, updateMailProducerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mailProducerService.remove(+id);
  }
}
