import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { hash, compare } from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Hortifruit } from '../../hortifruits/entities/hortifruit.entity';
import { UsersService } from '../../users/users.service';
import { HortifruitsService } from '../../hortifruits/hortifruits.service';
import { Role } from '../enums/role.enum';
import { LoginDto } from '../dtos/login.dto';

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role: Role;
  };
  hortifruit?: {
    id: string;
    name: string;
    email: string;
    logo_url?: string;
  };
}

interface TokenPayload {
  email: string;
  sub: string;
  type: 'user' | 'hortifruit';
  role?: Role;
}

interface RefreshTokenPayload extends TokenPayload {
  tokenId: string;
}

type AuthenticatedEntity = {
  id: string;
  email: string;
  type: 'user' | 'hortifruit';
  role?: Role;
  [key: string]: any;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Hortifruit)
    private hortifruitRepository: Repository<Hortifruit>,
    private jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly hortifruitsService: HortifruitsService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return hash(password, saltRounds);
  }

  private async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    console.log('Validating password');
    console.log('Input password:', password);
    console.log('Hashed password:', hashedPassword);
    try {
      const isValid = await compare(password, hashedPassword);
      console.log('Password validation result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Error validating password:', error);
      return false;
    }
  }

  private generateTokens(payload: TokenPayload): { access_token: string; refresh_token: string } {
    // Gera um ID único para o refresh token
    const refreshTokenId = Math.random().toString(36).substr(2, 9);

    // Access token com vida curta (15 minutos)
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    // Refresh token com vida mais longa (30 dias)
    const refresh_token = this.jwtService.sign(
      { ...payload, tokenId: refreshTokenId },
      { expiresIn: '7d' },
    );

    return { access_token, refresh_token };
  }

  async validateUser(email: string, password: string): Promise<AuthenticatedEntity | null> {
    try {
      const user = await this.usersService.findByEmailWithPassword(email);
      if (!user) return null;

      const isPasswordValid = await this.validatePassword(password, user.password);
      if (!isPasswordValid) return null;

      // Remove a senha e adiciona o tipo e role
      const { password: _, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        type: 'user',
        role: user.role || Role.USER,
      };
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  async validateHortifruit(email: string, password: string): Promise<AuthenticatedEntity | null> {
    try {
      console.log('Validating hortifruit:', email);
      const hortifruit = await this.hortifruitsService.findByEmailWithPassword(email);
      console.log('Found hortifruit:', hortifruit ? 'yes' : 'no');
      if (!hortifruit) return null;

      console.log('Hortifruit password:', hortifruit.password);
      console.log('Input password:', password);
      console.log('Validating password');
      const isPasswordValid = await this.validatePassword(password, hortifruit.password);
      console.log('Password valid:', isPasswordValid ? 'yes' : 'no');
      if (!isPasswordValid) return null;

      // Remove a senha e adiciona o tipo
      const { password: _, ...hortifruitWithoutPassword } = hortifruit;
      return {
        ...hortifruitWithoutPassword,
        type: 'hortifruit',
        role: Role.HORTIFRUIT,
      };
    } catch (error) {
      console.error('Error validating hortifruit:', error);
      if (error.status === 404) return null;
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; refresh_token: string; user: AuthenticatedEntity }> {
    console.log('Login attempt:', { email: loginDto.email, type: loginDto.type });
    let entity: AuthenticatedEntity | null = null;

    if (loginDto.type === 'user') {
      entity = await this.validateUser(loginDto.email, loginDto.password);
    } else if (loginDto.type === 'hortifruit') {
      entity = await this.validateHortifruit(loginDto.email, loginDto.password);
    }

    if (!entity) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      email: entity.email,
      sub: entity.id,
      type: entity.type,
      role: entity.role,
    };

    console.log('Login successful, generating tokens for:', payload);
    const tokens = this.generateTokens(payload);

    return {
      ...tokens,
      user: entity,
    };
  }

  async refreshAccessToken(refresh_token: string): Promise<{ access_token: string }> {
    try {
      // Verifica se o refresh token é válido
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refresh_token);
      
      // Verifica se o usuário/hortifruit ainda existe
      let entity: AuthenticatedEntity | null = null;
      
      if (payload.type === 'user') {
        const user = await this.usersService.findOne(payload.sub);
        if (user) {
          entity = { ...user, type: 'user', role: user.role || Role.USER };
        }
      } else if (payload.type === 'hortifruit') {
        const hortifruit = await this.hortifruitsService.findOne(payload.sub);
        if (hortifruit) {
          entity = { ...hortifruit, type: 'hortifruit', role: Role.HORTIFRUIT };
        }
      }

      if (!entity) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // Gera um novo access token
      const access_token = this.jwtService.sign({
        email: payload.email,
        sub: payload.sub,
        type: payload.type,
        role: entity.role,
      });

      return { access_token };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  async validateToken(token: string): Promise<AuthenticatedEntity | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token);

      if (payload.type === 'user') {
        const user = await this.usersService.findOne(payload.sub);
        return user ? { ...user, type: 'user', role: user.role || Role.USER } : null;
      } else if (payload.type === 'hortifruit') {
        const hortifruit = await this.hortifruitsService.findOne(payload.sub);
        return hortifruit ? { ...hortifruit, type: 'hortifruit', role: Role.HORTIFRUIT } : null;
      }

      return null;
    } catch {
      return null;
    }
  }
}
