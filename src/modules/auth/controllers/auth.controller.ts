import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiUnauthorizedResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from './refresh-token.dto';

@ApiTags('auth')
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
        refresh_token: {
          type: 'string',
          description: 'Token JWT de refresh',
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

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter novo access token usando refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Novo access token gerado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido ou expirado',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      return await this.authService.refreshAccessToken(refreshTokenDto.refresh_token);
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }
}
