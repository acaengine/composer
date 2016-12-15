/**
* @Author: Alex Sorafumo
* @Date:   13/09/2016 2:54 PM
* @Email:  alex@yuion.net
* @Filename: inc.ts
* @Last modified by:   Alex Sorafumo
* @Last modified time: 15/12/2016 11:41 AM
*/

import { ACAHttp } from './aca-http.service';
import { OAuthService } from './oauth2.service';

export let ACA_AUTH_PROVIDERS = [
    ACAHttp, OAuthService
];
