// Import all directives
import { Binding } from './directives/binding';
import { Debug } from './directives/debug';

// Export all directives
export * from './directives/binding';
export * from './directives/debug';

// Export convenience property
export const ACA_COMPOSER_DIRECTIVES: any[] = [
  Binding,
  Debug
];
