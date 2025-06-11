import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  street: string;

  @IsString()
  number: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  neighborhood: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zip_code: string;

  @IsString()
  @IsOptional()
  reference_point?: string;

  @IsBoolean()
  @IsOptional()
  is_default?: boolean;

  @IsEnum(['home', 'work', 'store'])
  type: 'home' | 'work' | 'store';

  @IsString()
  @IsOptional()
  hortifruit_id?: string;
}
