import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateDonationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  count?: number;

  @IsOptional()
  @IsDateString()
  expiration?: string;

  @IsOptional()
  @IsInt()
  category_id?: number;

  @IsOptional()
  @IsIn(['available', 'donated'])
  status?: string;
}
