import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string, type: 'user' | 'hortifruit' = 'user') {
    let entity;

    if (type === 'user') {
      entity = await this.authService.validateUser(email, password);
    } else if (type === 'hortifruit') {
      entity = await this.authService.validateHortifruit(email, password);
    }

    if (!entity) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return entity;
  }
}
