import { SetMetadata } from '@nestjs/common';

export const RequiresType = (type: 'user' | 'hortifruit') => SetMetadata('type', type);
