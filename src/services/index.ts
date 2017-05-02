/**
 * @Author: Alex Sorafumo
 * @Date:   19/10/2016 10:47 AM
 * @Email:  alex@yuion.net
 * @Filename: index.ts
 * @Last modified by:   Alex Sorafumo
 * @Last modified time: 15/12/2016 11:41 AM
 */

 // Import all services
 import { ACA_AUTH_PROVIDERS } from './auth';
 import { DataStoreWorkerService } from './data-store-worker.service';
 import { DataStoreService } from './data-store.service';
 import { Resources } from './resources';
 import { SystemsService } from './systems';

 // Export all services
 export * from './auth';
 export * from './systems';
 export * from './data-store.service';
 export * from './data-store-worker.service';

 declare const WorkerGlobalScope: any;

 // Export services for module providers
 export const SERVICES: any[] = [
     ...ACA_AUTH_PROVIDERS,
     SystemsService,
     Resources,
     DataStoreService,
 ];
