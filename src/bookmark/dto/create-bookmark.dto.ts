import { IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';
import { Url } from 'url';

export class CreateBookmarkDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsUrl()
  link: string;
}
