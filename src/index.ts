import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';

import { DIRECTIVES } from './directives';
import { PIPES } from './pipes';
import { SERVICES } from './services';
import 'rxjs/Rx';

export * from './directives';
export * from './pipes';
export * from './services';

@NgModule({
  	declarations: [
    	...DIRECTIVES,
    	...PIPES
  	],
  	imports: [ HttpModule, CommonModule ],
  	exports: [
    	...DIRECTIVES,
    	...PIPES
  	],
  	providers: [
  		...SERVICES
  	]
})
export class ACA_COMPOSER_MODULE {
    version: string = '0.3.4';
    build: string = '2016-10-24_1';
    constructor() {
        console.debug(`ACA Angular 2 Composer Library - v${this.version} b${this.build}`);
        if(!window['debug_module']) {
            window['debug_module'] = [];
        }
    }
}
