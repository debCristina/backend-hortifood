import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { AuthService } from '../modules/auth/auth.service';
import { Role } from '../modules/auth/enums/role.enum';
import { UsersService } from '../modules/users/users.service';

async function bootstrap() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const usersService = app.get(UsersService);

    // Criar usuário admin
    const adminUser = await usersService.create({
      name: 'Admin',
      email: 'admin@hortifood.com',
      password: 'Admin@123',
      phone: '11999999999',
      role: Role.ADMIN,
      addresses: [{
        street: 'Rua Admin',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01001-000',
        type: 'home'
      }]
    });

    logger.log(`✅ Admin criado com sucesso! ID: ${adminUser.id}`);
  } catch (error) {
    logger.error('❌ Erro ao executar seed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
