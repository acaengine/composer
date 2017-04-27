/**
* @Author: Alex Sorafumo
* @Date:   09/12/2016 9:39 AM
* @Email:  alex@yuion.net
* @Filename: index.ts
* @Last modified by:   Alex Sorafumo
* @Last modified time: 06/02/2017 11:28 AM
*/

import { NgModule } from '@angular/core';
import { CommonModule, APP_BASE_HREF } from '@angular/common';
import { WorkerAppModule, ClientMessageBrokerFactory } from '@angular/platform-webworker';
import { HttpModule } from '@angular/http';

import { DIRECTIVES } from './directives';
import { PIPES } from './pipes';
import { SERVICES } from './services';
import 'rxjs/Rx';

export * from './directives';
export * from './pipes';
export * from './services';
export * from './data-store.broker';

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
export class ComposerModule {
    version: string = '0.5.8';
    build: string = '2017-04-06.v1';
    constructor() {
        console.debug(`[ACA][LIBRARY] Composer - Version: ${this.version} | Build: ${this.build}`);
    }
}

export let ACA_COMPOSER_MODULE = ComposerModule;
