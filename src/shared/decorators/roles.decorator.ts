import { SetMetadata } from '@nestjs/common';

export enum Role {
  USER = 'user',
  HORTIFRUIT = 'hortifruit',
  ADMIN = 'admin',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
