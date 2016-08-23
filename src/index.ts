import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';

import {ACA_COMPOSER_DIRECTIVES} from './directives';
import {ACA_COMPOSER_PIPES} from './pipes';
import {ACA_COMPOSER_PROVIDERS} from './services';

export * from './directives';
export * from './pipes';
export * from './services';

@NgModule({
  	declarations: [
    	...ACA_COMPOSER_DIRECTIVES,
    	...ACA_COMPOSER_PIPES
  	],
  	imports: [ HttpModule, CommonModule ],
  	exports: [
    	...ACA_COMPOSER_DIRECTIVES,
    	...ACA_COMPOSER_PIPES
  	],
  	providers: [
  		...ACA_COMPOSER_PROVIDERS
  	]
})
export class ACA_COMPOSER_MODULE {

}
