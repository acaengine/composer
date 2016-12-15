/**
* @Author: Alex Sorafumo
* @Date:   19/10/2016 10:47 AM
* @Email:  alex@yuion.net
* @Filename: index.ts
* @Last modified by:   Alex Sorafumo
* @Last modified time: 15/12/2016 11:42 AM
*/

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
