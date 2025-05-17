import { ApiProperty } from "@nestjs/swagger";

export class ValidationErrorItem {
  @ApiProperty({
    description: 'The property that failed validation',
    example: 'email',
  })
  property!: string;

  @ApiProperty({
    description: 'The invalid value',
    example: 'invalid-email',
  })
  value?: any;

  @ApiProperty({
    description: 'The validation constraints that failed',
    example: 'email must be a valid email address',
  })
  constraints!: string;
}

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

  @ApiProperty({
    description: 'Validation errors (if applicable)',
    type: [ValidationErrorItem],
    required: false,
  })
  errors?: ValidationErrorItem[];
}
