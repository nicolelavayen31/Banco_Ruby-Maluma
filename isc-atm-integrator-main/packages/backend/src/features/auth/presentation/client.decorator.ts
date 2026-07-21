import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { IAuthClient } from '../domain/auth-client.interface';

export const Client = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): IAuthClient => {
        const request = ctx.switchToHttp().getRequest();
        return request.user as IAuthClient;
    },
);
