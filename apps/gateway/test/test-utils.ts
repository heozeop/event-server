import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

// Mock guard that simulates a logged-in user with all roles
export class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = {
      id: '1',
      email: 'test@example.com',
      roles: ['USER', 'ADMIN', 'OPERATOR', 'AUDITOR'],
    };

    return true;
  }
}

export class MockRolesGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

// Global APP guard that always returns true
export class MockAppGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

// Helper function to set up the test application
export function setupTestApp(app: INestApplication): INestApplication {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  return app;
}
