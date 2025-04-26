import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from 'src/config/configuration';
import { ExamplesModule } from './examples/examples.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RoleModule } from './role/role.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { PostModule } from './posts/post.module';
import { GradeModule } from './grades/grade.module';
import { SubjectsModule } from './subjects/subjects.module';
import { ClassModule } from './classes/class.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ProductModule } from './products/product.module';
import { TypeProductsModule } from './type-products/type-products.module';
import { CategoriesModule } from './categories/categories.module';
import { ContactsModule } from './contacts/contacts.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Gốc thư mục chứa file tĩnh
      serveRoot: '/api/public', // Đường dẫn để client truy cập
    }),
    JwtModule.register({
      global: true,
      secret: 'thienthanh132',
      signOptions: { expiresIn: '60m' },
    }),
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        try {
          const connection = {
            type: configService.get('DB_TYPE') || dbConfig.type,
            host: configService.get('DB_HOST') || dbConfig.host,
            port: configService.get('DB_PORT') || dbConfig.port,
            username: configService.get('DB_USER') || dbConfig.username,
            password: configService.get('DB_PASS') || dbConfig.password,
            database: configService.get('DB_NAME') || dbConfig.database,
            synchronize: true,
            autoLoadEntities: true,
          };
          console.log(dbConfig, 'tttttt');
          return connection;
        } catch (error) {
          console.log(error);
        }
      },
    }), ExamplesModule, UsersModule, AuthModule, RoleModule, PostModule, GradeModule, SubjectsModule, ClassModule, ProductModule, TypeProductsModule, CategoriesModule, ContactsModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD, // Đăng ký AuthGuard cho tất cả các route
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
