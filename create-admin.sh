#!/bin/bash

# Registrar o usuário admin
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@hortifood.com",
    "password": "Admin@123",
    "phone": "11999999999"
  }'

echo "\n\nAgora execute o seguinte comando SQL no seu banco de dados:"
echo "UPDATE users SET role = 'ADMIN' WHERE email = 'admin@hortifood.com';"

echo "\n\nCredenciais do admin:"
echo "Email: admin@hortifood.com"
echo "Senha: Admin@123" 