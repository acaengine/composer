/**
* @Author: Alex Sorafumo
* @Date:   09/12/2016 9:39 AM
* @Email:  alex@yuion.net
* @Filename: index.ts
* @Last modified by:   alex.sorafumo
* @Last modified time: 17/01/2017 11:00 AM
*/

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
    version: string = '0.3.7';
    build: string = '2017-01-17.v7';
    constructor() {
        console.debug(`ACA Angular 2 Composer Library - Version: ${this.version} | Build: ${this.build}`);
        if(!window['debug_module']) {
            window['debug_module'] = [];
        }
    }
}
