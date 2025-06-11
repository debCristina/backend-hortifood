import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const typeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: configService.get('DB_TYPE', 'sqlite') as any,
  database: configService.get<string>('DB_NAME', './db.sqlite'),
  entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  synchronize: true,
  logging: true,
});
