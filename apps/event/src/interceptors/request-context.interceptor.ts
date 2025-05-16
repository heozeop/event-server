import { MikroORM, RequestContext } from '@mikro-orm/core';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(private readonly orm: MikroORM) {}

  intercept(ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    // creates a new RequestContext for each RPC/TCP call
    return RequestContext.create(this.orm.em, () => next.handle());
  }
}
