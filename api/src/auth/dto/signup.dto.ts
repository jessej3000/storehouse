import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  firstname!: string;

  @IsString()
  @IsNotEmpty()
  lastname!: string;

  @IsString()
  @IsNotEmpty()
  gender!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  contact!: string;

  @Type(() => Number)
  @IsInt()
  stake_id!: number;

  @Type(() => Number)
  @IsInt()
  ward_id!: number;
}
