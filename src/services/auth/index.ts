/**
 * @Author: Alex Sorafumo
 * @Date:   13/09/2016 2:54 PM
 * @Email:  alex@yuion.net
 * @Filename: index.ts
 * @Last modified by:   Alex Sorafumo
 * @Last modified time: 15/12/2016 11:41 AM
 */

 import { CommsService } from './comms.service';
 import { MockHttp } from './mock-http';
 import { OAuthService } from './oauth2.service';

 export * from './comms.service';
 export * from './mock-http';

 export let ACA_AUTH_PROVIDERS = [
     CommsService, OAuthService,
 ];
