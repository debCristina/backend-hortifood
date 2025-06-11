import { Controller, Post, Body, HttpStatus, HttpCode, UseGuards, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realiza o login do usuário' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login realizado com sucesso',
    schema: {
      properties: {
        access_token: {
          type: 'string',
          description: 'Token JWT de acesso',
        },
        user: {
          type: 'object',
          description: 'Dados do usuário',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  async login(@Body() loginDto: LoginDto) {
    console.log('Login attempt:', { email: loginDto.email, type: loginDto.type });
    try {
      const result = await this.authService.login(loginDto);
      console.log('Login successful');
      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra um novo usuário' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuário registrado com sucesso',
    schema: {
      properties: {
        access_token: {
          type: 'string',
          description: 'Token JWT de acesso',
        },
        user: {
          type: 'object',
          description: 'Dados do usuário',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  @ApiConflictResponse({ description: 'Email já cadastrado' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna os dados do usuário autenticado' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dados do usuário retornados com sucesso',
    type: User,
  })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  async me(@CurrentUser() user: User) {
    return user;
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza o token de acesso' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token atualizado com sucesso',
    schema: {
      properties: {
        access_token: {
          type: 'string',
          description: 'Novo token JWT de acesso',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou expirado' })
  async refresh(@CurrentUser() user: User) {
    return this.authService.refresh(user);
  }
}
