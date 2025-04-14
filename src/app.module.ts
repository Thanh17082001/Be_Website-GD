import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from 'src/config/configuration';
import { ExamplesModule } from './examples/examples.module';

@Module({
  imports: [
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
    }), ExamplesModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
