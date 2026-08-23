import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CombinedAuthGuard extends AuthGuard(['jwt', 'api-key']) {
    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const hasApiKey = request.headers?.['x-api-key'];
        const hasAuthHeader = request.headers?.authorization;

        if (hasApiKey) {
            const guard = new (AuthGuard('api-key'))();
            return guard.canActivate(context) as Promise<boolean>;
        }

        if (hasAuthHeader) {
            const guard = new (AuthGuard('jwt'))();
            return guard.canActivate(context) as Promise<boolean>;
        }

        throw new UnauthorizedException(
            'Missing authentication: provide x-api-key header or Authorization: Bearer <token>',
        );
    }

    public handleRequest(err: any, user: any) {
        if (err || !user) {
            throw err || new UnauthorizedException();
        }
        return user;
    }
}
