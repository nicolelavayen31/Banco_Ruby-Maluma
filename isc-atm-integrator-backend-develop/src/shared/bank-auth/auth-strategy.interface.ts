export interface AuthRequest {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
}

export interface AuthStrategy {
    readonly type: 'jwt' | 'api_key';
    apply(request: AuthRequest, config: Record<string, any>): AuthRequest;
}
