import { ApiProperty } from "@nestjs/swagger";

export class ExceptionDto {
  @ApiProperty({
    description: 'The status code of the exception',
    example: 400,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'The message of the exception',
    example: 'Bad Request',
  })
  message!: string;

  @ApiProperty({
    description: 'The timestamp of the exception',
    example: '2021-01-01T00:00:00.000Z',
  })
  timestamp!: string;
}
