import { IsEmail } from 'class-validator';

export class QueryUserByEmailDto {
  @IsEmail()
  email!: string;
}
