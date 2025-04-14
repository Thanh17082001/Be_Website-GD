import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from 'src/common/exceptions/http-exception.filter';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { TransformInterceptor } from 'src/common/interceptors/transform.interceptor';
import { DataSource } from 'typeorm';
import * as express from 'express';
import { join } from 'path';
import { StaticFilesMiddleware } from 'src/common/middlewares/static-files.middleware';
import { AppModule } from './app.module';



async function bootstrap() {

  //version api
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);


  //middleware block static file
  app.use('/public', new StaticFilesMiddleware().use);

  // static file
  app.use(express.static(join(__dirname, '..', '..')));
  app.use(express.json({ limit: '1024mb' }));
  app.use(express.urlencoded({ limit: '1024mb', extended: true }));

  // set global route
  app.setGlobalPrefix('api'); 

  //html exceptions
  app.useGlobalFilters(new HttpExceptionFilter());

  // config swagger document api
  const config = new DocumentBuilder()
    .setTitle('API USING NEST')
    .setDescription('Author: Nguyen Thien Thanh')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha', // Sắp xếp các tag theo thứ tự từ A-Z
      persistAuthorization: true,
    },
  });

  //middleware
    //custom transform
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

    //custom logging
  app.useGlobalInterceptors(new LoggingInterceptor());

    //validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      disableErrorMessages: true
    }),
  );

  // Cấu hình CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

 
    //config server
  const PORT = configService.get<number>('PORT') || 3000;
  await app.listen(PORT, () => {
    console.log(`Server is  running at http://localhost:${PORT}/api`);
  });

  const dataSource = app.get(DataSource);
  if (dataSource.isInitialized) {
    console.log('Database is already connected!', configService.get<string>('database.database'));
  } else {
    try {
      await dataSource.initialize();
      console.log('Connected to the database successfully!', configService.get<string>('database.database').toUpperCase());
    } catch (error) {
      console.error('Database connection failed!', error, configService.get<string>('database.database').toUpperCase());
      process.exit(1); // Dừng ứng dụng nếu kết nối thất bại
    }
  }
}
bootstrap();
