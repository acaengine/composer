/**
 * @Author: Alex Sorafumo
 * @Date:   09/12/2016 9:39 AM
 * @Email:  alex@yuion.net
 * @Filename: index.ts
 * @Last modified by:   Alex Sorafumo
 * @Last modified time: 06/02/2017 11:28 AM
 */

 import { APP_BASE_HREF, CommonModule } from '@angular/common';
 import { NgModule } from '@angular/core';
 import { HttpModule } from '@angular/http';
 import { ClientMessageBrokerFactory, WorkerAppModule } from '@angular/platform-webworker';

 import 'rxjs/Rx';
 import { DIRECTIVES } from './directives';
 import { PIPES } from './pipes';
 import { SERVICES } from './services';
 import { COMPOSER } from './settings';

 export * from './directives';
 export * from './pipes';
 export * from './services';
 export * from './data-store.broker';

 @NgModule({
     declarations: [
     ...DIRECTIVES,
     ...PIPES,
     ],
     imports: [ HttpModule, CommonModule ],
     exports: [
     ...DIRECTIVES,
     ...PIPES,
     ],
     providers: [
     ...SERVICES,
     ],
 })
 export class ComposerModule {
     private static init: boolean = false;
     private version: string = '0.6.16';
     private build: string = '2017-07-25.v1';

     constructor() {
         if (!ComposerModule.init) {
             ComposerModule.init = true;
             COMPOSER.version(this.version, this.build);
         }
     }
 }

 export let ACA_COMPOSER_MODULE = ComposerModule;
