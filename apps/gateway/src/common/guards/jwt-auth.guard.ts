import { AUTH_CMP } from '@libs/cmd';
import {
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport';
import { firstValueFrom } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    // Check if the route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // First validate the JWT token structure
    const isValid = await super.canActivate(context);
    if (!isValid) {
      return false;
    }

    // Get the request and extract token
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Get user from request (set by JWT strategy)
    const user = request.user;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid user data');
    }

    // Validate token against Redis through auth service
    try {
      const isValid = await firstValueFrom(
        this.authClient.send(
          { cmd: AUTH_CMP.VALIDATE_TOKEN },
          { userId: user.id, accessToken: token },
        ),
      );

      if (!isValid) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    return user;
  }
}
