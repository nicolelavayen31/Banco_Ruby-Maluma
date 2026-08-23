import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ApiKeyAuthGuard extends AuthGuard('api-key') {
    public canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }
}
