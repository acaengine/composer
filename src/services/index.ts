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
 import { DataStoreService, DataStoreWorkerService } from './data-store.service';
 import { Resources } from './resources.service';
 import { SystemsService } from './systems';

 // Export all services
 export * from './auth-services';
 export * from './systems-service';
 export * from './data-store.service';

 declare const WorkerGlobalScope: any;

 // Export services for module providers
 export const SERVICES: any[] = [
     ...ACA_AUTH_PROVIDERS,
     SystemsService,
     Resources,
     DataStoreService,
 ];
