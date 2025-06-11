import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  MONEY = 'money',
}

export class CheckoutCartDto {
  @IsUUID()
  @IsNotEmpty()
  address_id: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  payment_method: PaymentMethod;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  change_amount?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
