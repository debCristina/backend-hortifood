# 🥬 HortiFood API

API REST desenvolvida em NestJS para conectar consumidores a feirantes/hortifruits locais.

## 🚀 Tecnologias

- NestJS
- TypeScript
- TypeORM
- SQLite (desenvolvimento)
- JWT Authentication
- Swagger Documentation

## 📋 Pré-requisitos

- Node.js (v18 ou superior)
- NPM (v9 ou superior)
- SQLite3

## 🚀 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/backend-hortifood.git
cd backend-hortifood
```

2. Instale as dependências:
```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto:
```env
# Configurações do JWT
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=30d

# Configurações do Banco de Dados
DATABASE_URL=sqlite:./data/database.sqlite

# Configurações do Servidor
PORT=3000
NODE_ENV=development

```

## 🏃‍♂️ Executando o Projeto

Para rodar o projeto em modo desenvolvimento:
```bash
npm run start:dev
```

A API estará disponível em: http://localhost:3000

## 📚 Documentação da API

A documentação completa da API está disponível em:
- Swagger UI: http://localhost:3000/docs
- OpenAPI JSON: http://localhost:3000/docs-json


## 🔐 Autenticação

A API usa JWT para autenticação. Existem dois tipos de usuários:

1. **Clientes**:
```bash
POST /api/auth/login/user
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

2. **Hortifruits**:
```bash
POST /api/auth/login/hortifruit
{
  "email": "hortifruit@email.com",
  "password": "senha123"
}
```

### Como obter e usar o token

Ao fazer login, a resposta trará um objeto como:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "..."
}
```

- Use o `accessToken` para autenticar nas rotas protegidas.
- Adicione o token no cabeçalho da requisição assim:

```
Authorization: Bearer <accessToken>
```

Exemplo usando curl:

```bash
curl -H "Authorization: Bearer eyJ..." http://localhost:3000/api/users/me
```

### Banco de Dados

O projeto usa SQLite por padrão. Para usar outro banco:

1. Instale o driver:
```bash
# PostgreSQL
npm install pg
# MySQL
npm install mysql2
```

2. Ajuste a configuração em `src/config/database.config.ts`

## 📝 Scripts Disponíveis

- `npm run start:dev` - Inicia em modo desenvolvimento com hot-reload
- `npm run lint` - Verifica estilo de código
- `npm run format` - Formata o código
- `npm run test` - Executa testes unitários

## 🔍 Endpoints Principais

### Usuários
- `POST /api/users` - Criar usuário
- `GET /api/users/me` - Dados do usuário logado
- `PATCH /api/users/me` - Atualizar dados

### Hortifruits
- `POST /api/hortifruits` - Criar hortifruit
- `GET /api/hortifruits/nearby` - Buscar hortifruits próximos
- `GET /api/hortifruits/:id/products` - Listar produtos

### Produtos
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `PATCH /api/products/:id` - Atualizar produto

### Carrinho
- `POST /api/carts/items` - Adicionar ao carrinho
- `GET /api/carts` - Ver carrinho
- `POST /api/carts/checkout` - Finalizar compra

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 🐛 Problemas Conhecidos

1. **Porta em uso**: Se a porta 3000 estiver em uso, você pode:
   - Mudar a porta no arquivo `.env`
   - Ou encerrar o processo usando a porta: `lsof -i :3000` e `kill -9 PID`

2. **Erro de CORS**: Se tiver problemas de CORS, verifique:
   - Configuração em `src/main.ts`
   - Origins permitidos em `.env`

## 📁 Estrutura do Projeto

```
src/
├── config/         # Configurações
├── modules/        # Módulos da aplicação
├── shared/         # Código compartilhado
└── database/       # Scripts de banco de dados
```

## Desenvolvido por
- Ana Eduarda Raposo Medeiros - uc23200232
- Anette Stefany Villalba Palomino - uc23200441
- Agatha Karenne De Andrade Machado - uc23200247
- Brunno Calado Cavalcante - uc23101210
-  Clarice Christine Soares Viana - uc23200796
- Débora Cristina Silva Ferreira - uc23200792
