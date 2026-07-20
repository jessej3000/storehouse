import { IsDateString, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateDonationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(1)
  count!: number;

  @IsDateString()
  expiration!: string;

  @IsInt()
  category_id!: number;
}
