/**
* @Author: Alex Sorafumo
* @Date:   19/10/2016 10:47 AM
* @Email:  alex@yuion.net
* @Filename: index.ts
* @Last modified by:   Alex Sorafumo
* @Last modified time: 15/12/2016 11:41 AM
*/

// Import all services
import { ACA_AUTH_PROVIDERS } from './auth-services';
import { SystemsService } from './systems-service';
import { Resources } from './resources.service';
import { DataStoreService, DataStoreWorkerService } from './data-store.service';

// Export all services
export * from './auth-services';
export * from './systems-service';
export * from './data-store.service';

declare let WorkerGlobalScope: any;

//let worker = (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope);
//export let DATA_STORE = { provide: DataStoreService, useClass: worker ? DataStoreWorkerService : DataStoreService };


// Export convenience property
export const SERVICES: any[] = [
    ...ACA_AUTH_PROVIDERS,
    SystemsService,
    Resources,
    DataStoreService
];
