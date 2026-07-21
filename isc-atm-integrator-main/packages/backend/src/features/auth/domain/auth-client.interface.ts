export interface IAuthClient {
    authType: 'user' | 'api_key';
    userId?: string;
    apiKeyId?: string;
    agreementId: string;
    agreementName?: string;
    permissions: string[];
}
