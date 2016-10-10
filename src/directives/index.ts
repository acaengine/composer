// Import all directives
import { Binding } from './binding.directive';
import { Debug } from './debug.directive';

// Export all directives
export * from './binding.directive';
export * from './debug.directive';

// Export convenience property
export const DIRECTIVES: any[] = [
  Binding,
  Debug
];
