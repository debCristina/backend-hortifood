import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('HortiFood API')
  .setDescription('API do sistema HortiFood para gerenciamento de hortifruti')
  .setVersion('1.0')
  .addTag('Autenticação')
  .addTag('Usuários')
  .addTag('Hortifruti')
  .addTag('Produtos')
  .addTag('Carrinho')
  .addTag('Endereços')
  .addBearerAuth()
  .build();
