/**
 * @Author: Alex Sorafumo
 * @Date:   19/10/2016 10:47 AM
 * @Email:  alex@yuion.net
 * @Filename: resources.service.ts
 * @Last modified by:   Alex Sorafumo
 * @Last modified time: 31/01/2017 3:06 PM
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { COMPOSER } from '../../settings';
import { CommsService } from '../auth/comms.service';
import { COMMON } from './common';
import { ResourceFactory } from './resource-factory.class';

@Injectable()
export class ResourcesService {
    public authLoaded: boolean = false;
    private factories: any; // key, value map of factories
    private url: string;
    private auth_promise: any = null;
    private mock: boolean = false;

    constructor(public http: CommsService, private http_unauth: HttpClient) { }

    get is_ready() { return this.http.hasToken; }

    /**
     * Initialises authentication details and sets up OAuth
     * @param  {any}    resolve Promise resolve function
     * @param  {any}    reject  Promise reject function
     * @return {void}
     */
    public initAuth(resolve: any, reject: any) {
        COMPOSER.log('RESRC', `Loading Authority...`);
        if (this.mock) {
            this.authLoaded = true;
            return resolve();
        }
        const parts = this.url.split('/');
        const uri = parts.splice(0, 3).join('/');
        const base_el = document.getElementsByTagName('base')[0];
        const base = base_el ? (base_el.href ? base_el.href : '/') : '/';
        const redirect = base.indexOf(location.origin) < 0 ? (location.origin + base) : base;
        // Make sure URL is set before processing authentication.
        if (!this.url || this.url === '' || this.url.indexOf('http') < 0) {
            return setTimeout(() => this.initAuth(resolve, reject), 500);
        }
        this.get('Authority').get_authority().then((auth: any) => {
            COMPOSER.log(`RESRC`, `Authority loaded. Session: ${auth.session === true}`);
            if (typeof auth !== 'object') {
                return reject({ message: 'Auth details no valid.' });
            }
            let url = encodeURIComponent(location.href);
            url = auth.login_url.replace('{{url}}', url);
            this.http.setupOAuth({
                loginRedirect: (url[0] === '/' ? (uri + url) : url),
            });
            if (auth.session) {
                this.http.setLoginStatus(auth.session);
            }
            this.authLoaded = true;
            setTimeout(() => {
                this.http.tryLogin();
                resolve();
            }, 200);
        }, (err: any) => {
            COMPOSER.error('RESRC', 'Error getting authority.', err);
            this.http.setupOAuth({
                loginRedirect: `${uri}/auth/login`,
            });
            this.http.tryLogin();
            reject(err);
        });
    }
    /**
     * Sets up OAuth with the given options
     * @param  {any}    options OAuth details
     * @return {void}
     */
    public setup(options: any) {
        this.http.setupOAuth({
            loginUrl: options.oauth_server,
            refreshUri: options.oauth_tokens,
            redirectUri: options.redirect_uri,
            clientId: this.http.hash(options.redirect_uri),
            login_local: options.login_local,
            scope: options.scope
        });
        this.url = options.api_endpoint;
    }

    /**
     * Initialises all the resource factories for each route
     * @param  {string} url_base Base resource URL, defaults to origin + '/control/'
     * @return {Promise<any>}    Returns a promise when resolves the state of the auth.
     */
    public init(url_base?: string, mock: boolean = false) {
        if (mock) {
            this.http.mock();
            this.mock = mock;
        }
        return new Promise<any>((resolve, reject) => {
            if (!url_base && !this.url) {
                this.url = location.origin + '/control/';
            } else {
                this.url = url_base ? url_base : this.url;
            }
            if (this.url[this.url.length - 1] !== '/') {
                this.url += '/';
            }
            let custom: any;
            // Factory for API Modules
            this.new('Module', this.url + 'api/modules/:id/:task', {
                id: '@id',
                task: '@_task',
            }, COMMON.crud);
            // Factory for System Modules
            this.new('SystemModule', this.url + 'api/systems/:sys_id/modules/:mod_id', {
                mod_id: '@module_id',
                sys_id: '@system_id',
            }, COMMON.crud);
            // Factory for API Triggers
            this.new('Trigger', this.url + 'api/triggers/:id', {
                id: '@id',
            }, COMMON.crud);
            // Factory for system triggers
            custom = JSON.parse(JSON.stringify(COMMON.crud));
            custom.query = {
                method: COMMON.cmd.GET,
                headers: COMMON.headers,
                url: this.url + 'api/system_triggers',
            };
            this.new('SystemTrigger', this.url + 'api/triggers/:id', {
                id: '@id',
            }, custom);
            // Factory for System
            custom = JSON.parse(JSON.stringify(COMMON.crud));
            custom.funcs = {
                method: COMMON.cmd.GET,
                headers: COMMON.headers,
                url: this.url + 'api/systems/:id/funcs',
            };
            custom.exec = {
                method: COMMON.cmd.POST,
                headers: COMMON.headers,
                url: this.url + 'api/systems/:id/exec',
                // isArray: true
            };
            custom.types = {
                method: COMMON.cmd.GET,
                headers: COMMON.headers,
                url: this.url + 'api/systems/:id/types',
                // isArray: true
            };
            custom.count = {
                method: COMMON.cmd.GET,
                headers: COMMON.headers,
                url: this.url + 'api/systems/:id/count',
            };
            this.new('System', this.url + 'api/systems/:id/:task', {
                id: '@id',
                task: '@_task',
            }, custom);
            // Factory for Dependencies
            this.new('Dependency', this.url + 'api/dependencies/:id/:task', {
                id: '@id',
                task: '@_task',
            }, COMMON.crud);
            // Factory for Node
            this.new('Node', this.url + 'api/nodes/:id', {
                id: '@id',
            }, COMMON.crud);
            // Factory for Group
            this.new('Group', this.url + 'api/groups/:id', {
                id: '@id',
            }, COMMON.crud);
            // Factory for Zone
            this.new('Zone', this.url + 'api/zones/:id', {
                id: '@id',
            }, COMMON.crud);
            // Factory for Discovery
            custom = JSON.parse(JSON.stringify(COMMON.crud));
            custom.scan = {
                method: COMMON.cmd.POST,
                headers: COMMON.headers,
                url: this.url + 'api/discovery/scan',
            };
            this.new('Discovery', this.url + 'api/discovery/:id', {
                id: '@id',
            }, custom);
            // Factory for Logs
            custom = JSON.parse(JSON.stringify(COMMON.crud));
            custom.missing_connections = {
                method: COMMON.cmd.GET,
                headers: COMMON.headers,
                url: this.url + 'api/logs/missing_connections',
            },
                custom.system_logs = {
                    method: COMMON.cmd.GET,
                    headers: COMMON.headers,
                    url: this.url + 'api/logs/system_logs',
                };
            this.new('Log', this.url + 'api/logs/:id', {
                id: '@id',
            }, custom);
            // Factory for User
            custom = JSON.parse(JSON.stringify(COMMON.crud));
            custom.current = {
                method: COMMON.cmd.GET,
                headers: COMMON.headers,
                url: this.url + 'api/users/current',
            };
            this.new('User', this.url + 'api/users/:id', {
                id: '@id',
            }, custom);

            // Resource for Authority
            let auth: any;
            auth = {};
            auth.get_authority = (auth_url?: string) => {
                if (!auth_url) {
                    auth_url = this.url;
                }
                if (auth_url.indexOf('http') < 0) {

                }
                return (new Promise((auth_res, auth_rej) => {
                    let authority: any;
                    const parts = auth_url.split('/');
                    const url = parts.splice(0, 3).join('/') + '/';
                    this.http_unauth.get(url + 'auth/authority')
                        .subscribe(
                        (data: any) => authority = data,
                        (err: any) => auth_rej(err),
                        () => auth_res(authority),
                    );
                }));
            };
            if (this.factories === undefined) {
                this.factories = {};
            }
            this.factories.Authority = auth;
            this.initAuth(resolve, reject);
        });
    }
    /**
     * Function to get the user access token for the API
     * @return {string} Returns an OAuth access token
     */
    public getToken() {
        return this.http.token;
    }
    /**
     * Function checks if the the user is current authorised.
     * @return {void}
     */
    public checkAuth() {
        this.http.checkAuth(() => COMPOSER.log('RESRC', 'Refreshed Auth'));
    }
    /**
     * Creates a new resource factory with the given parameters.
     * @param  {string} name    Name of the resource factory
     * @param  {string} url     Base API URL of the resources
     * @param  {any}    params  Route paramters available on the API URL
     * @param  {any}    methods Request methods that are avaiable on this resource
     * @return {void}
     */
    public new(name: string, url: string, params: any, methods: any) {
        const factory = new ResourceFactory(url, params, methods, this.http);
        factory.service = this;
        if (this.factories === undefined) {
            this.factories = {};
        }
        this.factories[name] = factory;
    }

    /**
     * Function to get a resource factory with the given name
     * @param  {string} name Name of the resource factory to get
     * @return {ResourceFactory} Returns a resource factory, null if not found
     */
    public get(name: string) {
        if (!this.authLoaded) {
            COMPOSER.log(`RESRC`, `Not ready to perform API requests.`, null, 'warn');
        }
        return this.factories && this.factories[name] ? this.factories[name] : null;
    }
}
