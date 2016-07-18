import { ACAHttp } from './aca-http.service.ts';
import { OAuthService } from './oauth2.service.ts';

export let ACA_AUTH_PROVIDERS = [
    ACAHttp, OAuthService
];
