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

// import { SERVICES } from './services';
import { CommsService } from './services/auth/comms.service';
import { ResourcesService } from './services/resources/resources.service';
import { ComposerDebugService } from './services/debug.service';
import { SystemsService } from './services/systems/systems.service';
import { OAuthService } from './services/auth/oauth2.service';
import { DataStoreService } from './services/data-store.service';

// import { DIRECTIVES } from './directives';
import { BindingDirective } from './directives/binding.directive';
import { DebugDirective } from './directives/debug.directive';

import { COMPOSER } from './settings';

// export * from './directives';
// export * from './services';
// export * from './data-store.broker';

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
    private version: string = '0.8.9';
    private build: string = '2018-03-08.v1';

    constructor() {
        if (!ComposerModule.init) {
            ComposerModule.init = true;
            COMPOSER.version(this.version, this.build);
        }
    }

    public static forRoot(): ModuleWithProviders {
        return {
            ngModule: ComposerModule,
            providers: [
                // ...SERVICES
                CommsService,
                ResourcesService,
                ComposerDebugService,
                SystemsService,
                OAuthService,
                DataStoreService
            ]
        };
    }
}

export let ACA_COMPOSER_MODULE = ComposerModule;
