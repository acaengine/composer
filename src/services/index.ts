// Import all services
import { ACA_AUTH_PROVIDERS } from './auth-services/inc';
import { SystemsService } from './systems-service';
import { Resources } from './resources.service';

// Export all services
export * from './auth-services';
export * from './systems-service';

// Export convenience property
export const SERVICES: any[] = [
    ...ACA_AUTH_PROVIDERS,
    SystemsService,
    Resources
];
