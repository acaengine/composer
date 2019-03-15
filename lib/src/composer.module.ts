/**
 * @Author: Alex Sorafumo
 * @Date:   09/12/2016 9:39 AM
 * @Email:  alex@yuion.net
 * @Filename: index.ts
 * @Last modified by:   Alex Sorafumo
 * @Last modified time: 06/02/2017 11:28 AM
 */

import { CommonModule } from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
// import { ClientMessageBrokerFactory, WorkerAppModule } from '@angular/platform-webworker';

// import { DIRECTIVES } from './directives';
import { BindingDirective } from './directives/binding.directive';
import { DebugDirective } from './directives/debug.directive';

import { COMPOSER } from './settings';

import * as moment_api from 'moment';
const moment = moment_api;

@NgModule({
    declarations: [
        // Declare Directive
        // ...DIRECTIVES,
        BindingDirective,
        DebugDirective,
    ],
    imports: [
        HttpClientModule,
        CommonModule
    ],
    exports: [
        // Export Directives
        // ...DIRECTIVES,
        BindingDirective,
        DebugDirective,
    ]
})
export class ComposerModule {
    private static init: boolean = false;
    private build = moment(1552619760000);
    public static version = '0.10.11';

    constructor() {
        if (!ComposerModule.init) {
            const now = moment();
            ComposerModule.init = true;
            const build = now.isSame(this.build, 'd') ? `Today at ${this.build.format('h:mmA')}` : this.build.format('Do MMM YYYY, h:mmA');
            COMPOSER.version(ComposerModule.version, build);
        }
    }

    public static forRoot(): ModuleWithProviders {
        return {
            ngModule: ComposerModule,
            providers: []
        };
    }
}

export let ACA_COMPOSER_MODULE = ComposerModule;
