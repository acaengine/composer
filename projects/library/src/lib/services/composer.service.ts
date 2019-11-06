import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    Composer, EngineAuthService, EngineBindingService, EngineWebsocket, EngineApplicationsService,
    EngineAuthSourcesService, EngineDriversService, EngineModulesService, EngineSystemsService,
    EngineZonesService, EngineUsersService, EngineHttpClient, EngineDomainsService, ComposerOptions
} from '@acaprojects/ts-composer';

@Injectable({
    providedIn: 'root'
})
export class ComposerService {

    /** Initialise Composer */
    public setup(options: ComposerOptions) {
        Composer.init(options);
    }

    /** Observable for the intialised state of composer */
    public get initialised(): Observable<boolean> {
        return Composer.initialised;
    }

    /** Observable for the intialised state of composer */
    public get is_initialised(): boolean {
        return Composer.is_initialised;
    }

    /** HTTP Client for making request with composer credentials */
    public get http(): EngineHttpClient {
        return Composer.http;
    }

    /** Authentication service for Composer */
    public get auth(): EngineAuthService {
        return Composer.auth;
    }

    /** Service for binding to engine's realtime API */
    public get bindings(): EngineBindingService {
        return Composer.bindings;
    }
    /** HTTP service for engine applications */
    public get applications(): EngineApplicationsService {
        return Composer.applications;
    }

    /** HTTP service for engine auth sources */
    public get auth_sources(): EngineAuthSourcesService {
        return Composer.auth_sources;
    }

    /** HTTP service for engine domains */
    public get domains(): EngineDomainsService {
        return Composer.domains;
    }

    /** Interface for engine realtime API communications */
    public get realtime(): EngineWebsocket {
        return Composer.realtime;
    }

    /** HTTP service for engine drivers */
    public get drivers(): EngineDriversService {
        return Composer.drivers;
    }

    /** HTTP service for engine modules */
    public get modules(): EngineModulesService {
        return Composer.modules;
    }

    /** HTTP service for engine systems */
    public get systems(): EngineSystemsService {
        return Composer.systems;
    }

    /** HTTP service for engine auth sources */
    public get users(): EngineUsersService {
        return Composer.users;
    }

    /** HTTP service for engine auth sources */
    public get zones(): EngineZonesService {
        return Composer.zones;
    }
}
