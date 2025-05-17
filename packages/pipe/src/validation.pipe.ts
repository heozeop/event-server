import { PinoLoggerService } from '@libs/logger';
import {
  BadRequestException,
  Injectable,
  ValidationPipe as NestValidationPipe,
  ValidationError
} from '@nestjs/common';

@Injectable()
export class ValidationPipe extends NestValidationPipe {
  constructor(private readonly logger: PinoLoggerService) {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        // Format validation errors in a more readable way
        const formattedErrors = validationErrors.map((error) => {
          const constraints = error.constraints
            ? Object.values(error.constraints).join(', ')
            : 'Invalid value';

          return {
            property: error.property,
            value: error.value,
            constraints,
          };
        });

        // Log the formatted validation errors
        this.logger.warn('Validation failed', {
          errors: formattedErrors,
          context: 'ValidationPipe',
        });

        // Return the exception with formatted details
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation Failed',
          errors: formattedErrors,
          timestamp: new Date().toISOString(),
        });
      },
    });
  }
}
