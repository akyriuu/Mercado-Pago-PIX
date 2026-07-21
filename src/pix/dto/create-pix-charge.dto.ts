import {
  IsEmail,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreatePixChargeDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @MinLength(3)
  description: string;

  @IsEmail()
  payerEmail: string;

  @IsString()
  @MinLength(11)
  payerDocument: string; //<><><>numberCPFCNPJ
}
