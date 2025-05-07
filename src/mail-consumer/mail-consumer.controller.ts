import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import * as nodemailer from 'nodemailer';

@Controller()
export class MailConsumerController {
  @EventPattern('mail.send')
  async handleSendMail(@Payload() payload: { to: string; subject: string; body: string }) {
    console.log('📩 Sending email to:', payload.to);
    console.log('Subject:', payload.subject);
    console.log('Body:', payload.body);

    // Cấu hình Nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.example.com', // Thay bằng SMTP server bạn sử dụng, ví dụ: Gmail, SendGrid
      port: 587, // Cổng SMTP (thường là 587 cho TLS, 465 cho SSL)
      secure: false, // Sử dụng TLS
      auth: {
        user: process.env.SMTP_USER, // Thông tin đăng nhập của bạn
        pass: process.env.SMTP_PASS, // Mật khẩu ứng dụng hoặc mật khẩu SMTP
      },
    });

    // Cấu hình nội dung email
    const mailOptions = { 
      from: '"Sender Name" <sender@example.com>', // Địa chỉ email người gửi
      to: payload.to, // Địa chỉ người nhận
      subject: payload.subject, // Tiêu đề email
      text: payload.body, // Nội dung email dạng text
      // html: payload.body, // Nếu bạn muốn gửi dưới dạng HTML
    };

    try {
      // Gửi email
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}
