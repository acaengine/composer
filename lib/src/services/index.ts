/**
 * @Author: Alex Sorafumo
 * @Date:   19/10/2016 10:47 AM
 * @Email:  alex@yuion.net
 * @Filename: index.ts
 * @Last modified by:   Alex Sorafumo
 * @Last modified time: 15/12/2016 11:41 AM
 */

// Import all services
import { CommsService } from './auth/comms.service';
import { OAuthService } from './auth/oauth2.service';
import { MockHttp } from './auth/mock-http/http.mock';
// import { DataStoreWorkerService } from './data-store-worker.service';
import { DataStoreService } from './data-store.service';
import { ComposerDebugService } from './debug.service';
import { ResourcesService } from './resources/resources.service';
import { SystemsService } from './systems/systems.service';

// Export all services
export * from './auth';
export * from './systems/systems.service';
export * from './resources/resources.service';
export * from './data-store.service';
export * from './debug.service';
// export * from './data-store-worker.service';

declare const WorkerGlobalScope: any;

// Export services for module providers
export const SERVICES: any[] = [
    CommsService,
    OAuthService,
    MockHttp,
    //
    ComposerDebugService,
    SystemsService,
    ResourcesService,
    DataStoreService,
];
