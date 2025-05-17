import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class QueryUserByEmailDto {
  @ApiProperty({
    description: 'The email of the user to query',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;
}
