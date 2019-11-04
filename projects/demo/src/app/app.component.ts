import { Component, ViewEncapsulation, OnInit } from '@angular/core';

import { ComposerService } from 'projects/library/src/lib/services/composer.service';
import { ComposerOptions } from '@acaprojects/ts-composer';

declare global {
    interface Window {
        composer: ComposerService;
        debug: boolean;
    }
}

@Component({
    selector: 'app-root',
    templateUrl: `./app.component.html`,
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
    public model: { [name: string]: any } = {};

    constructor(private _composer: ComposerService) { }

    public ngOnInit(): void {
        window.composer = this._composer;
        window.debug = true;
        this.initialiseComposer();
    }

    public initialiseComposer(tries: number = 0) {
            // Get domain information for configuring composer
        const host = location.hostname;
        const protocol = location.protocol;
        const port = location.port;
        const url = location.origin;
            // Generate configuration for composer
        const config: ComposerOptions = {
            scope: 'public',
            host: `${host}:${port}`,
            auth_uri: `${url}/auth/oauth/authorize`,
            token_uri: `${url}/auth/token`,
            redirect_uri: `${location.origin}/oauth-resp.html`,
            handle_login: true,
            mock: false
        };
            // Setup/Initialise composer
        this._composer.setup(config);
    }
}
