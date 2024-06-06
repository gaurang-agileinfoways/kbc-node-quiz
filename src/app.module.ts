import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import DatabaseConfiguration from './common/config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [DatabaseConfiguration],
      ignoreEnvFile: false,
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
