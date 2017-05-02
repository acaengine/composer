/**
 * @Author: Alex Sorafumo
 * @Date:   19/10/2016 10:47 AM
 * @Email:  alex@yuion.net
 * @Filename: aca-http.service.ts
 * @Last modified by:   Alex Sorafumo
 * @Last modified time: 06/02/2017 12:47 PM
 */

 import { Location } from '@angular/common';
 import { Inject, Injectable, Injector, ReflectiveInjector, Renderer } from '@angular/core';
 import { Headers, Http } from '@angular/http';
 import { ActivatedRoute, Router } from '@angular/router';
 import { Observable } from 'rxjs/Observable';

 import { Md5 } from 'ts-md5/dist/md5';
 import { COMPOSER } from '../../settings';
 import { DataStoreService } from '../data-store.service';
 import { MockHttp } from './http.mock';
 import { OAuthService } from './oauth2.service';

 const MAX_ERROR_COUNT = 5;

 @Injectable()
 export class CommsService {
     private trust: boolean = false;
     private sub: any;
     private refresh = false;
     private login_promise: Promise<any> = null;
     private retry: any = {};
     private debug: boolean = true;
     private http: any = null;
     private valid_params = [
     'loginUrl', 'loginRedirect', 'refreshUrl', 'redirectUri', 'refreshUri',
     'clientId', 'issuer', 'scope', 'oidc', 'logoutUrl',
     ];

     constructor(private route: ActivatedRoute,
                 private router: Router,
                 private http_service: Http,
                 private oAuthService: OAuthService,
                 private store: DataStoreService,
                 private loc: Location,
                 private injector: Injector) {
         this.http = this.http_service;
         store.local.getItem('trust').then((value: string) => {
             this.trust = (value === 'true');
         });
         this.sub = this.route.queryParams.subscribe( (params: any) => {
             this.trust = params.trust === 'true' ? params.trust === 'true' : this.trust;
             if (this.trust) {
                 store.local.setItem('trust', 'true');
             }
             if (params.logout && params.logout === 'true') {
                 this.oAuthService.logOut();
             }
         });
         this.oAuthService.tryLogin().then(() => { return; }, () => { return; });
     }

    /**
     * Initialises OAuth
     * @param  {string}  url      Login URL
     * @param  {string}  refresh  Refresh tokens URL
     * @param  {string}  redirect Redirect URI
     * @param  {string}  c_id     OAuth Client ID
     * @param  {string}  login    Login URL
     * @param  {string}  issuer   OAuth Issuer
     * @param  {string}  scope    OAuth Scope
     * @param  {boolean} oidc     Use Open ID
     * @param  {string}  logout   Logout URL
     * @return {void}
     */
     public setupOAuth(options: any) {
        const oauth = this.oAuthService;
        if (options) {
            for (const i in options) {
                if (typeof options[i] === 'string' && this.valid_params.indexOf(i) >= 0) {
                    oauth[i] = options[i];
                }
            }
        }
     }
    /**
     * Changes the http service to respond with mock data
     * @param {boolean = true} enable Enables or disables mock data responses
     * @return {void}
     */
     public mock(enable: boolean = true) {
        if (enable && this.http instanceof Http) {
            const resolvedProviders = ReflectiveInjector.resolve([MockHttp]);
            const childInjector = ReflectiveInjector.fromResolvedProviders(resolvedProviders, this.injector);

            const http: MockHttp = childInjector.get(MockHttp);
            this.http = http;
        } else if (this.http instanceof MockHttp && this.http_service) {
            this.http = this.http_service;
        }
     }
    /**
     * Attempt to login to the system
     * @return {void}
     */
     public tryLogin() {
        COMPOSER.log('COMMS', `Trying Login`);
        if (this.oAuthService.code) {
             this.login().then(() => {
                 COMPOSER.log('COMMS', `Got Access Token.`);
             });
         }
     }

    /**
     * Wrapper for Angular 2 HTTP GET with auth
     * @param  {string} url     Request URL
     * @param  {any}    options Request Options
     * @return {Observable} Returns an observable which acts like the Http observable
     */
     public get(url: string, options?: any) {
        return new Observable((observer: any) => {
            this.processOptions(url, null, options).then((req: any) => {
                if (req.auth) {
                    this.http.get(req.url, req.options)
                    .map((res: any) => res.json())
                    .subscribe(
                                (data: any) => observer.next(data),
                                (err: any) => this.error(err, req, observer),
                                () => observer.complete(),
                                );
                } else {
                    this.error({status: 401, message: 'No auth token.'}, req, observer);
                }
            });
        });
     }

    /**
     * Wrapper for Angular 2 HTTP POST with auth
     * @param  {string} url     Request URL
     * @param  {any}    body    (Optional)Request Body
     * @param  {any}    options (Optional)Request Options
     * @return {Observable} Returns an observable which acts like the Http observable
     */
     public post(url: string, body?: any, options?: any) {
        return new Observable((observer: any) => {
            this.processOptions(url, body, options).then((req: any) => {
                req.type = 'post';
                if (req.auth) {
                    this.http.post(req.url, req.body, req.options)
                    .map((res: any) => res.json())
                    .subscribe(
                                (data: any) => observer.next(data),
                                (err: any) => this.error(err, req, observer),
                                () => observer.complete(),
                                );
                } else {
                    this.error({status: 401, message: 'No auth token.'}, req, observer);
                }
            });
        });
     }

    /**
     * Wrapper for Angular 2 HTTP PUT with auth
     * @param  {string} url     Request URL
     * @param  {any}    body    (Optional)Request Body
     * @param  {any}    options (Optional)Request Options
     * @return {Observable} Returns an observable which acts like the Http observable
     */
     public put(url: string, body?: any, options?: any) {
        return new Observable((observer: any) => {
            this.processOptions(url, body, options).then((req: any) => {
                req.type = 'put';
                if (req.auth) {
                    this.http.put(req.url, req.body, req.options)
                    .map((res: any) => res.json())
                    .subscribe(
                                (data: any) => observer.next(data),
                                (err: any) => this.error(err, req, observer),
                                () => observer.complete(),
                                );
                } else {
                    this.error({status: 401, message: 'No auth token.'}, req, observer);
                }
            });
        });
     }

    /**
     * Wrapper for Angular 2 HTTP DELETE with auth
     * @param  {string} url     Request URL
     * @param  {any}    options (Optional)Request Options
     * @return {Observable} Returns an observable which acts like the Http observable
     */
     public delete(url: string, options?: any) {
        return new Observable((observer: any) => {
            this.processOptions(url, null, options).then((req: any) => {
                req.type = 'delete';
                this.http.delete(req.url, req.options)
                .map((res: any) => res.json())
                .subscribe(
                            (data: any) => observer.next(data),
                            (err: any) => this.error(err, req, observer),
                            () => observer.complete(),
                            );
            });
        });
     }
    /**
     * Creates a MD5 hash of the given string
     * @param  {string} str String to hash
     * @return {string}     Returns a hash of the given string
     */
     public hash(str: string) {
        return Md5.hashStr(str, false) as string;
     }

    /**
     * Login to the system with the set details
     * @return {Promise<any>} Returns a promise which resolves with an access token
     */
     public login() {
        if (this.login_promise === null) {
            COMPOSER.log('COMMS', `Attempting login.`);
            this.login_promise = new Promise((resolve, reject) => {
                this.performLogin(resolve, reject);
            });
        }
        return this.login_promise;
     }

     public logout() {
         this.oAuthService.logOut();
     }
    /**
     * Get access token
     * @return {string} Returns access token
     */
     get token() {
         return this.login();
     }

     get hasToken() {
         if (this.http instanceof MockHttp) {
             return new Promise<boolean>((resolve) => {
                 resolve(true);
             });
         } else {
             return this.oAuthService.hasValidAccessToken();
         }
     }

    /**
     * Check whether or not the user is logged in
     * @return {[type]} [description]
     */
     public isLoggedIn() {
         return this.token ? true : (this.refresh ? null : false);
     }

    /**
     * Refreshs access token
     * @param  {any}    resolve Login promise resolve
     * @param  {any}    reject  Login promise reject
     * @param  {number}
     * @return {void}
     */
     public refreshToken(resolve: any, reject: any, retries: number = 1) {
         const oauth: any = this.oAuthService;
         this.refresh = true;
         oauth.refresh_url.then((url: any) => {
             let tokens: any;
             this.http.post(url, '')
             .map((res: any) => res.json())
             .subscribe(
                (data: any) => tokens = data,
                (err: any) => {
                    const err_codes = [0, 400, 401, 403];
                    // Try refresh with root client ID
                    if (err && (err_codes.indexOf(err.status)
                        || (err.status === 0 && err.ok === false))
                        && url.indexOf(this.hash(`${location.origin}/oauth-resp.html`)) < 0 && retries < 10) {

                        COMPOSER.log('COMMS', `Failed token refresh request for ${url}`);
                        oauth.getRefreshToken().then((rt: string) => {
                            oauth.redirectUri = `${location.origin}/oauth-resp.html`;
                            const client_id = this.hash(`${location.origin}/oauth-resp.html`);
                            this.store.local.getItem(`${client_id}_refresh_token`).then((rt_root: string) => {
                                if (rt && !rt_root) {
                                    this.store.local.setItem(`${oauth.clientId}_refresh_token`, rt);
                                }
                                setTimeout(() => {
                                    this.refreshToken(resolve, reject, retries + 1);
                                }, 500 * retries);
                            });
                        });
                    } else {
                        this.processLoginError(err, reject);
                    }
                }, () => {
                    COMPOSER.log('COMMS', `Got new tokens:`, tokens);
                    this.updateToken(tokens, resolve);
                    setTimeout(() => { this.loginDone(); }, 100);
                },
            );
         });
     }

    /**
     * Sets whether the user has logged in or not
     * @param  {boolean} status Logged in status
     * @return {void}
     */
     public setLoginStatus(status: boolean) {
         const oauth: any = this.oAuthService;
         if (status === true) {
             this.store.session.setItem(`${oauth.clientId}_login`, 'true');
         } else {
             this.store.session.removeItem(`${oauth.clientId}_login`);
         }
     }
    /**
     * Removes all authentication related keys from storage
     * @return {void}
     */
     public clearStore() {
         const oauth: any = this.oAuthService;
         oauth.clearAuth();
     }
    /**
     * Checks if user is authorised
     * @param  {any}    cb_fn Callback function which is passed the response
     * @return {void}
     */
     public checkAuth(cb_fn: any) {
         COMPOSER.log('COMMS', `Checking Auth.`);
         if (this.login_promise === null) {
             const parts: any = this.oAuthService.loginUrl.split('/');
             const uri: any = parts.splice(0, 3).join('/');
             this.oAuthService.authorizationHeader().then((token: string) => {
                 const headers = new Headers({ Authorization: (token ? token : '') });
                 this.http.get(uri + '/auth/oauth/token/info', { headers }).subscribe(
                      (data: any) => cb_fn(data),
                      (err: any) => this.processLoginError(err, () => { return; }),
                      () => { return; },
                      );
             });
         }
     }

     private performLogin(resolve: any, reject: any) {
        if (this.http instanceof MockHttp) {
            this.login_promise = null;
            return resolve('mock_token');
        }
        const oauth: any = this.oAuthService;
        if (!oauth || !oauth.clientId || oauth.clientId === '') {
            setTimeout(() => {
                this.performLogin(resolve, reject);
            }, 500);
            return;
        }
        oauth.hasValidAccessToken().then((valid: boolean) => {
            if (valid) {
                COMPOSER.log('COMMS', `Valid access token availiable.`);
                oauth.getAccessToken().then((token: string) => {
                    resolve(token);
                    setTimeout(() => { this.loginDone(); }, 100);
                });
            } else {
                COMPOSER.log('COMMS', `No valid access token available.`);
                // Attempt to finish logging in
                oauth.tryLogin().then((status: any) => {
                    // Check if valid access token is available
                    oauth.hasValidAccessToken().then((valid_after_load: boolean) => {
                        if (valid_after_load) {
                            COMPOSER.log('COMMS', `Valid access token availiable.`);
                            oauth.getAccessToken().then((token: string) => {
                                resolve(token);
                                setTimeout(() => { this.loginDone(); }, 100);
                            });
                        } else {
                            if (this.trust) {
                                COMPOSER.log('COMMS', `Device is trusted`);
                                oauth.response_type = 'code';
                                this.store.local.getItem(`${oauth.clientId}_refresh_token`).then((refresh: string) => {
                                    if (refresh || oauth.code) { // Refresh token exists
                                        COMPOSER.log('COMMS', `Refresh token found. Refreshing access token...`);
                                        // Perform refresh
                                        if (oauth.clientId === '') {
                                            resolve({ message : 'OAuth not setup, retrying after 100ms'});
                                            setTimeout(() => {
                                                this.loginDone();
                                                this.login();
                                            }, 100);
                                        }
                                        else {
                                            this.refreshToken(resolve, reject);
                                        }
                                    } else { // No refresh token
                                        COMPOSER.log('COMMS', `No Refresh Token or Code`);
                                        let path = location.href;
                                        if (location.hash.indexOf(path) >= 0
                                            && location.href.indexOf(location.origin + '/#/') >= 0) {

                                            if (path.indexOf('?') >= 0) {
                                                path = path.split('?')[0];
                                            }
                                        }
                                        const here = path;
                                        this.store.local.setItem(`oauth_redirect`, here);
                                        oauth.initImplicitFlow();
                                        setTimeout(() => { this.loginDone(); }, 100);
                                    }
                                });

                            } else {
                                COMPOSER.log('COMMS', `Device is not trusted.`);
                                oauth.response_type = 'token';
                                COMPOSER.log('COMMS', `Starting login process...`);
                                let path = location.href;
                                if (location.hash.indexOf(path) >= 0
                                    && location.href.indexOf(location.origin + '/#/') >= 0) {

                                    if (path.indexOf('?') >= 0) {
                                        path = path.split('?')[0];
                                    }
                                }
                                const here = path;
                                this.store.local.setItem(`oauth_redirect`, here);
                                oauth.initImplicitFlow();
                                setTimeout(() => { this.loginDone(); }, 100);
                            }
                        }
                    });
                });
            }
        });
     }

    /**
     * Called when login is completed
     * @return {void}
     */
     private loginDone() {
        this.cleanUrl();
        this.login_promise = null;
     }

    /**
     * Handles errors when attempting to login
     * @param  {any}    err    Error response from login attempt
     * @param  {any}    reject Login Promise reject function
     * @return {void}
     */
     private processLoginError(err: any, reject: any) {
        const oauth: any = this.oAuthService;
        this.storeError('login', err);
        // Clear storage
        if (err.status === 400 || err.status === 401) {
            COMPOSER.log('COMMS', `Error with credentials. Getting new credentials...`);
            this.clearStore();
            this.oAuthService.code = undefined;
            setTimeout(() => { this.loginDone(); }, 100);
            this.login().then(() => { return; }, (login_err) => { reject(login_err); });
        } else {
            setTimeout(() => { location.reload(); }, 5000);
            setTimeout(() => { this.loginDone(); }, 100);
        }
     }

    /**
     * Stores last couple errors in localStorage for debugging purposes
     * @param  {string}  type  Type of error
     * @param  {any}     error Error to store
     * @return {void}
     */
     private storeError(type: string, error: any) {
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'NOV', 'DEC'];
        const date = new Date();
        let hour: any = date.getHours();
        hour = hour < 10 ? '0' + hour : hour;
        let min: any = date.getMinutes();
        min = min < 10 ? '0' + min : min;
        let sec: any = date.getSeconds();
        sec = sec < 10 ? '0' + sec : sec;
        let now = `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${hour}:${min}:${sec}`;
        now = now.toLowerCase();
        this.store.local.setItem((`${type}_error: ${now}`), JSON.stringify(error));
        this.store.local.getItem(`${type}_error`).then((value: string) => {
            let error_list: any[] = [];
            if (value) {
                error_list = JSON.parse(value);
                if (error_list) {
                    error_list.push(now);
                    if (error_list.length >= MAX_ERROR_COUNT) {
                        for (let i = 0; i < error_list.length - MAX_ERROR_COUNT; i++) {
                            this.store.local.removeItem(`${type}_error: ${error_list[i]}`);
                        }
                        error_list.splice(0, error_list.length - MAX_ERROR_COUNT);
                    }
                } else {
                    error_list = [now];
                }
            } else {
                error_list = [now];
            }
            this.store.local.setItem(`${type}_error`, JSON.stringify(error_list));
        });
     }
    /**
     * Replaces old tokens with new
     * @param  {any}    data    Object contain new tokens and expiry
     * @param  {any}    resolve Login resolve function
     * @return {void}
     */
     private updateToken(data: any, resolve: any) {
        const oauth: any = this.oAuthService;
        if (data.access_token) {
            this.store.local.setItem(`${oauth.clientId}_access_token`, data.access_token);
        }
        if (data.refresh_token) {
            this.store.local.setItem(`${oauth.clientId}_refresh_token`, data.refresh_token);
        }
        if (data.expires_in) {
            const expiry: any = ((new Date()).getTime() + data.expires_in * 1000);
            this.store.local.setItem(`${oauth.clientId}_expires_at`, expiry.toString());
        }
        if (resolve) {
            resolve();
        }
        setTimeout(() => { this.loginDone(); }, 100);
     }
    /**
     * Clean up URL after logging in so that the ugly hash/query is not displayed
     * @return {void}
     */
     private cleanUrl() {
         const path = this.loc.path(false);
         if (location.search.indexOf('access_token') >= 0 || location.search.indexOf('code') >= 0) {
             this.loc.go(path, '');
             setTimeout(() => {
                 this.store.local.removeItem('oauth_redirect');
                 this.store.local.removeItem('oauth_finished');
             }, 5000);
         } else if (path.indexOf('?') >= 0 && (path.indexOf('access_token') >= 0 || path.indexOf('code') >= 0)) {
             this.loc.go(path.split('?')[0], '');
             setTimeout(() => {
                 this.store.local.removeItem('oauth_redirect');
                 this.store.local.removeItem('oauth_finished');
             }, 5000);
         }
     }

    /**
     * Process HTTP options
     * @param  {string} url     Request URL
     * @param  {any}    body    Request Body
     * @param  {any}    options Request Options
     * @return {any} Returns the details for the request
     */
     private processOptions(url: string, body?: any, options?: any) {
         const oauth = this.oAuthService;
         return this.oAuthService.authorizationHeader().then((auth_header: string) => {
             const headers = new Headers({ Authorization: auth_header });
             if (options && options.headers) {
                 if (options.headers.values) {
                     const h = options.headers.values();
                     const k = options.headers.keys();
                     for (const i in h) {
                         if (k[i].toLowerCase() !== 'authorization') {
                             headers.append(k[i], h[i][0]);
                         }
                     }
                 } else {
                     const keys = Object.keys(options.headers);
                     for (const key of keys) {
                         if (key.toLowerCase() !== 'authorization') {
                             headers.append(key, options.headers[key]);
                         }
                     }
                 }
             }
             // Store request info for retry if needed.
             const req: any = {
                 type: 'get',
                 body,
                 url,
                 auth: ((auth_header !== '' && auth_header.indexOf('Bearer nul') < 0) || this.http instanceof MockHttp),
             };
             if (!req.options) {
                 req.options = {
                     headers,
                 };
             } else if (!req.options.headers) {
                 req.options.headers = headers;
             }
             return req;
         });
     }

    /**
     * Handler for HTTP request errors
     * @param  {any}    err Request error
     * @param  {any}    req Request details
     * @param  {any}    obs Request observable
     * @return {void}
     */
     private error(err: any, req: any, obs: any) {
        const hash = this.hash(req.url + req.body);
        if (!this.retry[hash]) {
            this.retry[hash] = 0;
        }
        if ((err.status === 401 || (err.status === 0 && err.ok === false)) && this.retry[hash] < 10) {
            // Re-authenticate if authentication error.
            setTimeout(() => {
                this.login()
                .then((res: any) => {
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
                    }, 500 * this.retry[hash]);
                }, (retry_err) => {
                    COMPOSER.error('COMMS', `Error logging in.`, retry_err);
                    this.clearStore();
                    location.reload();
                    this.retry[hash] = 0;
                });
            }, 200);
        } else { // Return error
            COMPOSER.log('COMMS', `Error processing request.`, err);
            obs.error(err);
            this.retry[hash] = 0;
        }
     }
 }
