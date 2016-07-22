import { ACAHttp } from './aca-http.service';
import { OAuthService } from './oauth2.service';

export let ACA_AUTH_PROVIDERS = [
    ACAHttp, OAuthService
];
