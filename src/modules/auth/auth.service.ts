import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { compare, hash } from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { Hortifruit } from '../hortifruits/entities/hortifruit.entity';
import { UsersService } from '../users/users.service';
import { HortifruitsService } from '../hortifruits/hortifruits.service';
import { LoginDto } from '../auth/dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { RefreshToken } from './entities/refresh-token.entity';

interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  type: 'user' | 'hortifruit';
}

interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface HortifruitRegistrationData {
  name: string;
  email: string;
  password: string;
  phone: string;
  document: string;
  description?: string;
  is_active?: boolean;
  is_open?: boolean;
  logo_url?: string;
  banner_url?: string;
  min_order_value?: number;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    type?: 'store';
  };
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: Omit<User, 'password'>;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Hortifruit)
    private hortifruitRepository: Repository<Hortifruit>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly usersService: UsersService,
    private readonly hortifruitsService: HortifruitsService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    return this.generateAuthResponse(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    if (registerDto.password.length < 6) {
      throw new BadRequestException('A senha deve ter no mínimo 6 caracteres');
    }

    const hashedPassword = await hash(registerDto.password, 10);

    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    return this.generateAuthResponse(user);
  }

  async refresh(user: User): Promise<AuthResponse> {
    const refreshedUser = await this.userRepository.findOne({
      where: { id: user.id },
      select: ['id', 'email', 'name', 'phone'],
    });

    if (!refreshedUser) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return this.generateAuthResponse(refreshedUser);
  }

  private async generateAuthResponse(user: User): Promise<AuthResponse> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = await this.generateRefreshToken(user);

    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token: accessToken,
      refresh_token: refreshToken.token,
      user: userWithoutPassword,
    };
  }

  private async generateRefreshToken(user: User): Promise<RefreshToken> {
    try {
      console.log('Gerando refresh token para usuário:', user.id);
      
      // Revoga todos os refresh tokens anteriores do usuário
      await this.refreshTokenRepository.update(
        { userId: user.id, isRevoked: false },
        { isRevoked: true }
      );

      const token = this.jwtService.sign(
        { sub: user.id, email: user.email },
        { expiresIn: '7d' }
      );

      console.log('Token JWT gerado:', token);

      const refreshToken = this.refreshTokenRepository.create({
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      });

      console.log('Refresh token criado:', refreshToken);

      const savedToken = await this.refreshTokenRepository.save(refreshToken);
      console.log('Refresh token salvo:', savedToken);

      return savedToken;
    } catch (error) {
      console.error('Erro ao gerar refresh token:', error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }

  generateResetPasswordToken(email: string): string {
    const payload = { email, purpose: 'reset_password' };
    return this.jwtService.sign(payload, { expiresIn: '1h' });
  }

  async validateResetPasswordToken(token: string): Promise<string> {
    try {
      const payload = await this.jwtService.verify(token);
      if (payload.purpose !== 'reset_password') {
        throw new UnauthorizedException('Token inválido');
      }
      return payload.email;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  async refreshAccessToken(refreshTokenString: string): Promise<{ access_token: string }> {
    try {
      console.log('Buscando refresh token:', refreshTokenString);
      // Verifica se o refresh token existe e é válido
      const refreshToken = await this.refreshTokenRepository.findOne({
        where: { token: refreshTokenString, isRevoked: false },
        relations: ['user'],
      });

      console.log('Refresh token encontrado:', refreshToken);

      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      if (refreshToken.expiresAt < new Date()) {
        await this.refreshTokenRepository.update(refreshToken.id, { isRevoked: true });
        throw new UnauthorizedException('Refresh token expirado');
      }

      // Gera um novo access token
      const payload = {
        sub: refreshToken.user.id,
        email: refreshToken.user.email,
        role: refreshToken.user.role,
      };

      console.log('Gerando novo access token com payload:', payload);

      return {
        access_token: this.jwtService.sign(payload, { expiresIn: '1h' }),
      };
    } catch (error) {
      console.error('Erro ao fazer refresh do token:', error);
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  async registerUser(userData: UserRegistrationData): Promise<User> {
    if (!userData.password) {
      throw new UnauthorizedException('Senha é obrigatória');
    }

    const hashedPassword = await hash(userData.password, 10);
    const userToCreate: DeepPartial<User> = {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      phone: userData.phone,
    };

    const user = this.userRepository.create(userToCreate);
    return this.userRepository.save(user);
  }

  async registerHortifruit(hortifruitData: HortifruitRegistrationData): Promise<Hortifruit> {
    const hashedPassword = await hash(hortifruitData.password, 10);

    const hortifruit = this.hortifruitRepository.create({
      ...hortifruitData,
      password: hashedPassword,
    });

    return this.hortifruitRepository.save(hortifruit);
  }
}
