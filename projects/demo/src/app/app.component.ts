import { Component, ViewEncapsulation, OnInit } from '@angular/core';

import { SystemsService } from 'projects/library/src/public-api';

declare global {
    interface Window {
        composer: SystemsService;
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

    constructor(private _systems: SystemsService) { }

    public ngOnInit(): void {
        window.composer = this._systems;
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
        const config: any = {
            id: 'AcaEngine',
            scope: 'public',
            protocol, host, port,
            oauth_server: `${url}/auth/oauth/authorize`,
            oauth_tokens: `${url}/auth/token`,
            redirect_uri: `${location.origin}/oauth-resp.html`,
            api_endpoint: `${url}/control/`,
            proactive: true,
            login_local: false,
            http: true,
        };
            // Setup/Initialise composer
        this._systems.setup(config);
    }
}
