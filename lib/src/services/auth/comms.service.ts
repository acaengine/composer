/**
 * @Author: Alex Sorafumo
 * @Date:   19/10/2016 10:47 AM
 * @Email:  alex@yuion.net
 * @Filename: aca-http.service.ts
 * @Last modified by:   Alex Sorafumo
 * @Last modified time: 06/02/2017 12:47 PM
 */

import { Location } from '@angular/common';
import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscriber, BehaviorSubject } from 'rxjs';

import { Md5 } from 'ts-md5/dist/md5';
import { COMPOSER } from '../../settings';
import { MockHttp } from './mock-http/http.mock';
import { OAuthService } from './oauth2.service';
import { DataStoreService } from '../data-store.service';

const MAX_ERROR_COUNT = 5;

@Injectable({
    providedIn: 'root'
})
export class CommsService {
    private trust: boolean = false;
    private refresh = false;
    private login_promise: Promise<string> = null;
    private retry: { [name: string]: number } = {};
    private debug: boolean = true;
    private http: HttpClient | MockHttp = null;
    private simple: boolean = false;
    private local_auth = false;
    private authority_loaded = false;
    private valid_params = [
        'login_url', 'login_redirect', 'refresh_url', 'redirect_uri', 'refresh_uri',
        'client_id', 'issuer', 'scope', 'oidc', 'logout_url', 'login_local', 'authority_loaded'
    ];

    private _offline = new BehaviorSubject<boolean>(false);
    private _offline_obs: Observable<boolean>;
    private _auth_issue = new BehaviorSubject<boolean>(false);
    private _auth_issue_obs: Observable<boolean>;

    private model: { [name: string]: any } = {};

    constructor(
        private http_service: HttpClient,
        private oAuthService: OAuthService,
        private data_store: DataStoreService,
        private loc: Location,
        private route: ActivatedRoute,
        private injector: Injector
    ) {
        this.http = this.http_service;
        this.route.queryParamMap.subscribe((params) => {
            if (params.has('trust')) {
                this.trust = params.get('trust') !== 'false';
                const c_id = oAuthService.get('client_id');
                this.store.setItem(`${c_id ? c_id + '_' : ''}trust`, 'true');
            }
            if (params.has('logout')) { this.oAuthService.logout(); }
        })
        const c_id = oAuthService.get('client_id');
        this.store.getItem(`${c_id ? c_id + '.' : ''}trust`).then((value) => this.trust = (value === 'true'));
        if (location.search.indexOf('logout=') >= 0) {
            this.oAuthService.logout();
        }
        this._offline_obs = this._offline.asObservable();
        this._auth_issue_obs = this._auth_issue.asObservable();
        this.oAuthService.tryLogin().then(() => null, () => null);
    }

    get store() {
        return this.oAuthService.storage;
    }

    public offline(next: (x: boolean) => void) {
        return this._offline_obs.subscribe(next);
    }

    public reinitAuth(next: (x: boolean) => void) {
        return this._auth_issue_obs.subscribe(next);
    }

    /**
     * Initialises OAuth
     * @param options OAuth options
     */
    public setupOAuth(options: { [name: string]: any }) {
        const oauth = this.oAuthService;
        if (options) {
            for (const i in options) {
                if (i && this.valid_params.indexOf(i) >= 0) {
                    oauth.model[i] = options[i];
                    if (i === 'login_local') {
                        this.local_auth = options[i];
                    }
                }
            }
            if (options.simple) {
                this.simple = true;
            }
            if (options.authority_loaded) {
                this.authority_loaded = true;
            }
                // Set trust to local storage
            if (this.trust) {
                this.store.setItem(`${oauth.get('client_id')}_trust`, 'true');
            }
            this.store.getItem(`${oauth.get('client_id')}_trust`).then((value) => this.trust = (value === 'true') || this.trust);
        }
    }
    /**
     * Change the http service to respond with mock data
     * @param enable Use mock data responses
     */
    public mock(enable: boolean = true) {
        if (enable && this.http instanceof HttpClient) {
            const childInjector = Injector.create([{ provide: MockHttp, deps: [] }], this.injector);
            const http: MockHttp = childInjector.get(MockHttp);
            this.http = http;
        } else if (!enable && this.http instanceof MockHttp && this.http_service) {
            this.http = this.http_service;
        }
    }

    /**
     * Attempt to logging in to the system
     */
    public tryLogin() {
        COMPOSER.log('COMMS', `Trying Login`);
        this.login().then(() => COMPOSER.log('COMMS', `Got Access Token.`), (e) => null);
    }

    public needsLogin(next: (state: boolean) => void) {
        return this.oAuthService.needsLogin(next);
    }

    /**
     * Wrapper for Angular HTTP GET with auth
     * @param url     Request URL
     * @param options Request Options
     * @return Observable wrapper for HTTPClient.get
     */
    public get(url: string, options?: { [name: string]: any }) {
        return new Observable((observer) => {
            this.processOptions(url, null, options).then((req: any) => {
                if (req.auth) {
                    (this.http as any).get(req.url, req.options)
                        .subscribe(
                            (data: any) => observer.next(data),
                            (err: any) => this.error(err, req, observer),
                            () => observer.complete(),
                    );
                } else {
                    this.error({ status: -1, clear: false, message: 'Authentication not loaded' }, req, observer);
                }
            });
        });
    }

    /**
     * Wrapper for Angular HTTP POST with auth
     * @param url     Request URL
     * @param body    (Optional)Request Body
     * @param options (Optional)Request Options
     * @return Observable wrapper for HTTPClient.post
     */
    public post(url: string, body?: { [name:string]: any } | string, options?: { [name:string]: any }) {
        return new Observable((observer: any) => {
            this.processOptions(url, body, options).then((req: any) => {
                req.type = 'post';
                if (req.auth) {
                    (this.http as any).post(req.url, req.body, req.options)
                        .subscribe(
                            (data: any) => observer.next(data),
                            (err: any) => this.error(err, req, observer),
                            () => observer.complete(),
                    );
                } else {
                    this.error({ status: -1, clear: false, message: 'Authentication not loaded' }, req, observer);
                }
            });
        });
    }

    /**
     * Wrapper for Angular HTTP PUT with auth
     * @param url     Request URL
     * @param body    (Optional)Request Body
     * @param options (Optional)Request Options
     * @return Observable wrapper for HTTPClient.put
     */
    public put(url: string, body?: { [name:string]: any }, options?: { [name:string]: any }) {
        return new Observable((observer) => {
            this.processOptions(url, body, options).then((req: any) => {
                req.type = 'put';
                if (req.auth) {
                    (this.http as any).put(req.url, req.body, req.options)
                        .subscribe(
                            (data: any) => observer.next(data),
                            (err: any) => this.error(err, req, observer),
                            () => observer.complete(),
                    );
                } else {
                    this.error({ status: -1, clear: false, message: 'Authentication not loaded' }, req, observer);
                }
            });
        });
    }

    /**
     * Wrapper for Angular HTTP DELETE with auth
     * @param url     Request URL
     * @param options (Optional)Request Options
     * @return Observable wrapper for HTTPClient.delete
     */
    public delete(url: string, options?: { [name:string]: any }) {
        return new Observable((observer) => {
            this.processOptions(url, null, options).then((req: any) => {
                req.type = 'delete';
                if (req.auth) {
                    (this.http as any).delete(req.url, req.options)
                        .subscribe(
                            (data: any) => observer.next(data),
                            (err: any) => this.error(err, req, observer),
                            () => observer.complete(),
                    );
                } else {
                    this.error({ status: -1, clear: false, message: 'Authentication not loaded' }, req, observer);
                }
            });
        });
    }
    /**
     * Create a MD5 hash of the given string
     * @param str String to hash
     * @return Hash of the given string
     */
    public hash(str: string) {
        return Md5.hashStr(str, false) as string;
    }

    /**
     * Login to the system with the set details
     * @return Promise of an access token
     */
    public login() {
        if (this.login_promise === null) {
            COMPOSER.log('COMMS', `Attempting login.`);
            this.login_promise = new Promise((rs, rj) => {
                if (this.authority_loaded) {
                    this.performLogin().then(
                        (i) => {
                            rs(i)
                            this.cleanUrl()
                            this.login_promise = null;
                        },
                        (e) => { this.login_promise = null; rj(e); });
                } else {
                    setTimeout(() => {
                        this.login_promise = null;
                        this.login().then((d) => rs(d), (e) => rj(e));
                    }, 500);
                }
            })
        }
        return this.login_promise;
    }

    public logout() {
        this.oAuthService.logout();
    }
    /**
     * Get access token
     * @return Access token
     */
    get token() {
        return new Promise((resolve, reject) => {
            this.hasToken.then(
                () => this.oAuthService.getAccessToken().then((token) => resolve(token)),
                () => this.login().then((d) => resolve(d), (e) => reject(e))
            );
        });
    }

    get hasToken() {
        return new Promise((resolve, reject) => {
            if (this.http instanceof MockHttp) {
                resolve(true);
            } else {
                this.oAuthService.hasValidAccessToken()
                    .then(() => resolve(true), () => resolve(false));
            }
        });
    }

    /**
     * Check whether or not the user is logged in
     * @return Logged in state of the user
     */
    public isLoggedIn() {
        return this.token ? true : (this.refresh ? null : false);
    }

    /**
     * Refresh access token
     * @param retries Number of retries performed
     */
    public refreshToken(retries: number = 0) {
        return new Promise((resolve, reject) => {
            const oauth: OAuthService = this.oAuthService;
            this.refresh = true;
            oauth.refresh_url.then((url: string) => {
                let tokens: any;
                (this.http as any).post(url, '')
                    .subscribe(
                        (data: any) => tokens = data,
                        (err: any) => {
                            // Try refresh with root client ID
                            if (err && err.status === 401
                                && url.indexOf(this.hash(`${location.origin}/oauth-resp.html`)) < 0 && retries < 5) {

                                COMPOSER.log('COMMS', `Failed token refresh request for ${url}`);
                                oauth.getRefreshToken().then((rt: string) => {
                                    oauth.model.redirect_uri = `${location.origin}/oauth-resp.html`;
                                    const client_id = this.hash(`${location.origin}/oauth-resp.html`);
                                    this.store.getItem(`${client_id}_refresh_token`).then((rt_root: string) => {
                                        if (rt && !rt_root) {
                                            this.store.setItem(`${oauth.get('client_id')}_refresh_token`, rt);
                                        }
                                        setTimeout(() => this.refreshToken(retries).then((v) => resolve(v), (e) => reject(e)), 500 * ++retries);
                                    });
                                });
                            } else if (err.status === 0) {
                                COMPOSER.error('COMMS', `Refresh failed with code 0. Headers may be malformed or missing CORS.`);
                                this.processLoginError(err).then((i) => resolve(i), (e) => reject(e));
                            } else {
                                this.processLoginError(err).then((i) => resolve(i), (e) => reject(e));
                            }
                        }, () => {
                            COMPOSER.log('COMMS', `Got new tokens:`, tokens);
                            this.updateToken(tokens, resolve);
                        },
                );
            });
        })
    }

    /**
     * Set whether the user has logged in or not
     * @param status Logged in status
     */
    public setLoginStatus(status: boolean) {
        const client_id = this.oAuthService.get('client_id');
        const store = this.data_store.session;
        this.oAuthService.set('has_session', status);
        return status === true ? store.setItem(`${client_id}_login`, 'true') : store.removeItem(`${client_id}_login`);
    }

    /**
     * Check if user is authorised
     * @param cb_fn Callback for the auth token state
     */
    public checkAuth(cb_fn: (token: string) => void) {
        COMPOSER.log('COMMS', `Checking Auth.`);
        if (this.login_promise === null) {
            const parts: string[] = this.oAuthService.model.login_url.split('/');
            const uri: string = parts.splice(0, 3).join('/');
            this.oAuthService.authorizationHeader().then((token: string) => {
                let headers = new HttpHeaders();
                headers = headers.set('Authorization', (token ? token : ''));
                (this.http as any).get(uri + '/auth/oauth/token/info', { headers, observe: "response" }).subscribe(
                    (data: any) => cb_fn(data),
                    (err: any) => this.processLoginError(err).then((i) => null, (e) => null),
                    () => null
                );
            });
        }
    }

    private performLogin(tries: number = 0) {
        if (tries > 3) {
            return new Promise((rs, rj) => rj('Log in attempt failed...'));
        }
        return new Promise((resolve, reject) => {
            if (this.http instanceof MockHttp) {
                this.login_promise = null;
                return resolve('mock_token');
            }
            const oauth = this.oAuthService;
            if (!oauth || !oauth.model.client_id || oauth.model.client_id === '') {
                COMPOSER.log('COMMS', `OAuth is not initialised.`);
                return setTimeout(() => this.performLogin().then((d) => resolve(d), (e) => reject(e)), 500);
            }
            COMPOSER.log('COMMS', `Checking for valid access token.`);
            oauth.hasValidAccessToken().then((valid: boolean) => {
                if (valid) {
                    COMPOSER.log('COMMS', `Valid access token availiable.`);
                    oauth.getAccessToken().then((token: string) => resolve(token));
                } else {
                    COMPOSER.log('COMMS', `No valid access token available.`);
                    oauth.stopReset();
                    // Attempt to finish logging in
                    oauth.tryLogin().then(() => {
                        // Check if valid access token is available
                        this.checkAccessToken().then((d) => resolve(d), (e) => reject(e));
                    }, (err) => {
                        COMPOSER.log('COMMS', `Log in attempt failed...`, null, 'warn');
                        setTimeout(() => this.performLogin(tries).then((d) => resolve(d), (e) => reject(e)), 300 * ++tries);
                    });
                }
            });
        });
    }

    private checkAccessToken(tries: number = 0) {
        if (this.oAuthService.get('run_flow')) {
            return new Promise((rs, rj) => {
                setTimeout(() => this.checkAccessToken(tries).then((i) => rs(i), (e) => rj(e)), 500);
            });
        }
        if (tries > 3) {
            return new Promise((rs, rj) => rj('Log in attempt failed...'));
        }
        return new Promise((resolve, reject) => {
            this.oAuthService.hasValidAccessToken().then((valid_after_load: boolean) => {
                if (valid_after_load) {
                    COMPOSER.log('COMMS', `Valid access token availiable.`);
                    this.oAuthService.getAccessToken().then((token: string) => resolve(token));
                } else {
                    if (this.trust || location.search.indexOf('trust=') >= 0) {
                        COMPOSER.log('COMMS', `Device is trusted`);
                        this.oAuthService.set('response_type', 'code');
                        this.checkRefreshToken().then((d) => resolve(d), (e) => reject(e));
                    } else {
                        COMPOSER.log('COMMS', `Device is not trusted.`);
                        this.oAuthService.set('response_type', 'token');
                        COMPOSER.log('COMMS', `Starting login process...`);
                        let path = location.href;
                        if (location.hash.indexOf(path) >= 0
                            && location.href.indexOf(location.origin + '/#/') >= 0) {

                            if (path.indexOf('?') >= 0) {
                                path = path.split('?')[0];
                            }
                        }
                        const here = path;
                        this.store.setItem(`oauth_redirect`, here);
                        setTimeout(() => {
                            this.oAuthService.initImplicitFlow();
                            setTimeout(() => this.checkAccessToken(tries).then((d) => resolve(d), (e) => reject(e)), 600 * ++tries);
                        }, 1000);
                    }
                }
            });
        });
    }

    private checkRefreshToken(tries: number = 0) {
        if (tries > 3) {
            return new Promise((rs, rj) => rj('Log in attempt failed...'));
        }
        return new Promise((resolve, reject) => {
            this.model.refresh = true;
            const oauth: any = this.oAuthService;
            this.store.getItem(`${oauth.get('client_id')}_refresh_token`).then((refresh: string) => {
                if (refresh || oauth.model.code) { // Refresh token exists
                    COMPOSER.log('COMMS', `Refresh token found. Refreshing access token...`);
                    // Perform refresh
                    if (oauth.get('client_id') === '') {
                        this.model.refresh = false;
                        resolve({ message: 'OAuth not setup, retrying after 100ms' });
                        setTimeout(() => this.login(), 100);
                    } else {
                        this.refreshToken().then((v) =>
                            setTimeout(() => resolve(v), 300),
                            (e) => reject(e)
                        );
                    }
                } else { // No refresh token
                    COMPOSER.log('COMMS', `No Refresh Token or Code`);
                    let path = location.href;
                    if (location.hash.indexOf(path) >= 0
                        && location.href.indexOf(location.origin + '/#/') >= 0) {

                        if (path.indexOf('?') >= 0) {  path = path.split('?')[0]; }
                    }
                    const here = path;
                    this.store.setItem(`oauth_redirect`, here);
                    setTimeout(() => {
                        oauth.initImplicitFlow();
                        setTimeout(() => reject('Not logged in'), 1000);
                        this.model.refresh = false;
                    }, 1000)
                }
            });
        });
    }

    /**
     * Handles errors when attempting to login
     * @param err    Error response from login attempt
     * @param reject Login Promise reject function
     * @return
     */
    private processLoginError(err: any) {
        return new Promise((resolve, reject) => {
            if (this.oAuthService.get('run_flow')) {
                return setTimeout(() => this.processLoginError(err).then((i) => resolve(i), (e) => reject(e)), 500);
            }
            this.storeError('login', err);
            // Clear storage
            if (err.status === 401) {
                COMPOSER.log('COMMS', `Error with credentials. Getting new credentials...`);
                this.oAuthService.clearAuth().then(() => {
                    this.oAuthService.set('code', undefined);
                    this.login_promise = null;
                    location.reload();
                });
            } else {
                setTimeout(() => this._auth_issue.next(true), 5000);
            }
            setTimeout(() => this.cleanUrl(), 100);
        });
    }

    /**
     * Stores last couple errors in localStorage for debugging purposes
     * @param type  Type of error
     * @param error Error to store
     * @return
     */
    private storeError(type: string, error: any) {
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'NOV', 'DEC'];
        const date = new Date();
        let hour: number | string = date.getHours();
        hour = hour < 10 ? '0' + hour : hour;
        let min: number | string = date.getMinutes();
        min = min < 10 ? '0' + min : min;
        let sec: number | string = date.getSeconds();
        sec = sec < 10 ? '0' + sec : sec;
        let now = `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${hour}:${min}:${sec}`;
        now = now.toLowerCase();
        this.store.setItem((`${type}_error: ${now}`), JSON.stringify(error));
        this.store.getItem(`${type}_error`).then((value: string) => {
            let error_list: string[] = [];
            if (value) {
                error_list = JSON.parse(value);
                if (error_list) {
                    error_list.push(now);
                    if (error_list.length >= MAX_ERROR_COUNT) {
                        for (let i = 0; i < error_list.length - MAX_ERROR_COUNT; i++) {
                            this.store.removeItem(`${type}_error: ${error_list[i]}`);
                        }
                        error_list.splice(0, error_list.length - MAX_ERROR_COUNT);
                    }
                } else {
                    error_list = [now];
                }
            } else {
                error_list = [now];
            }
            this.store.setItem(`${type}_error`, JSON.stringify(error_list));
        });
    }
    /**
     * Replaces old tokens with new
     * @param data    Object contain new tokens and expiry
     * @param resolve Login resolve function
     */
    private updateToken(data: { access_token?: string, refresh_token?: string, expires_in?: number }, resolve?: () => void) {
        const oauth = this.oAuthService;
        if (data.access_token) {
            this.store.setItem(`${oauth.get('client_id')}_access_token`, data.access_token);
        }
        if (data.refresh_token) {
            this.store.setItem(`${oauth.get('client_id')}_refresh_token`, data.refresh_token);
        }
        if (data.expires_in) {
            const expiry: any = ((new Date()).getTime() + data.expires_in * 1000);
            this.store.setItem(`${oauth.get('client_id')}_expires_at`, expiry.toString());
        }
        if (resolve) { setTimeout(() => { this.model.refresh = false; resolve(); }, 300); }
    }

    /**
     * Clean up URL after logging in so that the ugly hash/query is not displayed
     */
    private cleanUrl() {
        const path = this.loc.path(false);
        if (location.search.indexOf('access_token') >= 0 || location.search.indexOf('code') >= 0) {
            this.loc.go(path, '');
            setTimeout(() => {
                this.store.removeItem('oauth_redirect');
                this.store.removeItem('oauth_finished');
            }, 5000);
        } else if (path.indexOf('?') >= 0 && (path.indexOf('access_token') >= 0 || path.indexOf('code') >= 0)) {
            this.loc.go(path.split('?')[0], '');
            setTimeout(() => {
                this.store.removeItem('oauth_redirect');
                this.store.removeItem('oauth_finished');
            }, 5000);
        }
    }

    /**
     * Process HTTP options
     * @param url     Request URL
     * @param body    Request Body
     * @param options Request Options
     * @returns Details for the request
     */
    private processOptions(url: string, body?: { [name:string]: any } | string, options?: { [name:string]: any }) {
        return new Promise((resolve) => {
            let headers: HttpHeaders = new HttpHeaders();
            this.oAuthService.authorizationHeader().then((auth_header: string) => {
                headers = headers.set('Authorization', auth_header);
                if (options && options.headers) {
                    if (options.headers instanceof HttpHeaders) {
                        const keys = options.headers.keys();
                        for (const k of keys) {
                            if (k && k.toLowerCase() !== 'authorization') {
                                headers = headers.set(k, options.headers.get(k));
                            }
                        }
                    }
                }
                // Store request info for retry if needed.
                const req: any = {
                    type: 'get',
                    body,
                    url,
                    options: {
                        ...options,
                        headers
                    },
                    auth: ((auth_header !== '' && auth_header.indexOf('Bearer nul') < 0) || this.http instanceof MockHttp),
                };
                if (!req.options) { req.options = { headers }; }
                else if (!req.options.headers) { req.options.headers = headers; }
                resolve(req);
            });
        });
    }

    /**
     * Handler for HTTP request errors
     * @param err Request error
     * @param req Request details
     * @param obs Request observable
     */
    private error(err: any, req: any, obs: Subscriber<{}>) {
        const hash = this.hash(req.url + req.body);
        if (!this.retry[hash]) { this.retry[hash] = 0; }
        COMPOSER.error('COMMS', `Request to ${req.url} failed with code ${err ? err.status : 0}. ${err ? err.message : ''}`);
        const mock = this.http instanceof MockHttp;
        if (err && err.status === 401 && this.retry[hash] < 3 && !mock) {
            // Re-authenticate if authentication error.
            COMPOSER.log('COMMS', `Re-authenticating...`);
            this.retryAfterAuth(err, req, obs, hash);
        } else if (err && err.status === 401 && !mock && err.clear !== false) {
            COMPOSER.error('COMMS', `Error with auth details restarting fresh.`);
            this.oAuthService.reset();
            obs.error(err);
            this.retry[hash] = 0;
        } else { // Return error
            COMPOSER.log('COMMS', `Error processing request(${err.status}).`, err);
            if ((!err || err.status === 502 || err.status === 504) && this.retry[hash] < 3 && !mock) {
                this.retryAfterAuth(err, req, obs, hash);
            } else {
                obs.error(err);
                this.retry[hash] = 0;
            }
        }
    }

    private retryAfterAuth(err, req, obs: Subscriber<{}>, hash: string) {
        this.login().then(() => {
            COMPOSER.log('COMMS', `Retrying request to '${req.url}'...`);
            this.retry[hash] = this.retry[hash] ? this.retry[hash] + 1 : 1;
            setTimeout(() => {
                this.refresh = false;
                if (req.type === 'get' || req.type === 'delete') {
                    this[req.type](req.url, req.options).subscribe(
                        (data: any) => obs.next(data),
                        (retry_err: any) => obs.error(retry_err),
                        () => { obs.complete(); this.retry[hash] = 0; },
                    );
                } else {
                    this[req.type](req.url, req.body, req.options).subscribe(
                        (data: any) => obs.next(data),
                        (retry_err: any) => obs.error(retry_err),
                        () => { obs.complete(); this.retry[hash] = 0; },
                    );
                }
            }, 300 * this.retry[hash]);
        }, (retry_err) => {
            COMPOSER.error('COMMS', `Error logging in.`, retry_err);
            if (!err || err.clear !== false) {
                this.oAuthService.reset();
            }
            obs.error(err);
            this.retry[hash] = 0;
        });
    }
}
