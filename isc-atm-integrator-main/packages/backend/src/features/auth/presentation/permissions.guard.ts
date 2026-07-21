import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import type { IAuthClient } from '../domain/auth-client.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    public canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredPermissions?.length) {
            return true;
        }

        const request = context.switchToHttp().getRequest<{
            user: IAuthClient;
        }>();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException(
                'Authentication required for permission check',
            );
        }

        const hasAll = requiredPermissions.every((permission) =>
            user.permissions.includes(permission),
        );

        if (!hasAll) {
            throw new ForbiddenException({
                message: 'Insufficient permissions',
                required: requiredPermissions,
                granted: user.permissions,
            });
        }

        return true;
    }
}
