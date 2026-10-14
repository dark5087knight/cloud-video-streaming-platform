import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { typeOrmConfigAsync } from './common/config/typeorm.config';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { VideoModule } from './video/video.module';
import { VideoMetadataModule } from './video-metadata/video-metadata.module';
import { UploadModule } from './upload/upload.module';
import { SqsModule } from './sqs/sqs.module';
import { WorkerModule } from './worker/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
    SqsModule,
    AuthModule,
    UserModule,
    VideoModule,
    VideoMetadataModule,
    UploadModule,
    WorkerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.dataSource.query('SELECT 1');
      this.logger.log('DATABASE CONNECTION SUCCESSFUL');
    } catch (error) {
      this.logger.error('DATABASE CONNECTION FAILED:');
      this.logger.error(error);
    }
  }
}
