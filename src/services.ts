// Import all services
import { ACA_AUTH_PROVIDERS } from './services/auth-services/inc';
import { SystemsService } from './services/systems-service';

// Export all services
export * from './services/auth-services';
export * from './services/systems-service';

// Export convenience property
export const ACA_COMPOSER_PROVIDERS: any[] = [
  ...ACA_AUTH_PROVIDERS,
  SystemsService
];
