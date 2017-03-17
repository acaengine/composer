/**
* @Author: Alex Sorafumo
* @Date:   19/10/2016 10:47 AM
* @Email:  alex@yuion.net
* @Filename: aca-http.service.ts
* @Last modified by:   Alex Sorafumo
* @Last modified time: 06/02/2017 12:47 PM
*/

import { Injectable, Inject, Renderer } from '@angular/core';
import { Location } from '@angular/common';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Router, ActivatedRoute } from '@angular/router';

import { DataStoreService } from '../data-store.service';
import { OAuthService } from './oauth2.service';
import { Md5 } from 'ts-md5/dist/md5'
import { COMPOSER_SETTINGS } from '../../settings';

const MAX_ERROR_COUNT = 5;

@Injectable()
export class CommsService {
    private trust: boolean = false;
    private sub: any;
    private refresh = false;
    private login_promise: Promise<any> = null;
    private retry: any = {};
    private debug: boolean = true;

    constructor(private route: ActivatedRoute, 
    			private router: Router, 
    			private http: Http, 
    			private oAuthService: OAuthService, 
    			private store: DataStoreService,
    			private loc: Location){
        store.session.getItem('trust').then((value) => {
        	this.trust = (value === 'true');
        });
        COMPOSER_SETTINGS.observe('debug').subscribe((data: any) => {
        	//this.debug = data;
        });
        //*
        this.sub = this.route.queryParams.subscribe( (params: any) => {
            this.trust = params['trust'] === 'true' ? params['trust'] === 'true' : this.trust;
            store.session.setItem('trust', this.trust ? 'true': 'false');
            if(params['logout'] && params['logout']==='true'){
                this.oAuthService.logOut();
            }
        });
        //*/
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
    setupOAuth(url: string, refresh: string, redirect: string, c_id: string, login:string, issuer?: string, scope?: string, oidc?: boolean, logout?: string) {
        let oauth = this.oAuthService;
        oauth.loginUrl = url;
        oauth.loginRedirect = login;
        oauth.refreshUri = refresh;
        oauth.redirectUri = redirect;
        oauth.clientId = c_id;
        oauth.issuer = issuer ? issuer : (oauth.issuer ? oauth.issuer : '');
        oauth.scope = scope ? scope : (oauth.scope ? oauth.scope : '');
        oauth.oidc = oidc ? oidc : (oauth.oidc ? oauth.oidc : false);
        oauth.logoutUrl = logout ? logout : (oauth.logoutUrl ? oauth.logoutUrl : 'logout');
        /*
        this.login().then(() => {

        }, () => {

        });
        */
    }
    /**
     * Attempt to login to the system
     * @return {void}
     */
    tryLogin() {
        if(this.debug) console.debug('[COMPOSER][COMMS] Trying Login');
        if(this.oAuthService.code) this.login().then(() => {
            if(this.debug) console.debug('[COMPOSER][COMMS] Got Access Token.');
        });
    }
    /**
     * Clean up URL after logging in so that the ugly hash/query is not displayed
     * @return {void}
     */
    private cleanUrl() {
    	let path = this.loc.path(false);
    	if(location.search.indexOf('access_token') >= 0 || location.search.indexOf('code') >= 0){
        	this.loc.go(path, '');
        	//*
            setTimeout(() => {
	            this.store['local'].removeItem('oauth_redirect');
	            this.store['local'].removeItem('oauth_finished');
            }, 5000);
        } else if(path.indexOf('?') >= 0 && (path.indexOf('access_token') >= 0 || path.indexOf('code') >= 0)) {
        	this.loc.go(path.split('?')[0], '');
        	//*
            setTimeout(() => {
	            this.store['local'].removeItem('oauth_redirect');
	            this.store['local'].removeItem('oauth_finished');
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
    processOptions(url: string, body?: any, options?: any) {
    	let oauth = this.oAuthService;
    	return this.oAuthService.authorizationHeader().then((auth_header) => {
	        let headers = new Headers({ "Authorization": auth_header });
	        if(options && options.headers){
	            if(options.headers.values){
	            	let h = options.headers.values();
	            	let k = options.headers.keys();
	                for(var i in h) {
	                	if(k[i].toLowerCase() !== 'authorization') headers.append(k[i], h[i][0]);
	                }
	            } else {
	                let keys = Object.keys(options.headers);
	                for(let j = 0; j < keys.length; j++) {
	                    if(keys[j].toLowerCase() !== 'authorization') headers.append(keys[j], options.headers[keys[j]]);
	                }
	            }
	        }
	            // Store request info for retry if needed.
	        let req: any = {
	            type: 'get',
	            body: body,
	            url: url,
	            auth: (auth_header !== '' && auth_header.indexOf('Bearer null') < 0)
	        };
	        if(!req.options) req.options = { headers: headers};
	        else if(!req.options.headers) req.options.headers = headers;
	        return req;
    	})
    }

    /**
     * Wrapper for Angular 2 HTTP GET with auth
     * @param  {string} url     Request URL
     * @param  {any}    options Request Options
     * @return {Observable} Returns an observable which acts like the Http observable
     */
    get(url: string, options?: any) {
        return new Observable((observer: any) => {
        	this.processOptions(url, null, options).then((req) => {
	            if(req.auth) {
	                this.http.get(req.url, req.options)
	                .map(res => res.json())
	                .subscribe(
	                    data => observer.next(data),
	                    err => this.error(err, req, observer),
	                    () => observer.complete()
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
    post(url: string, body?: any, options?: any) {
        return new Observable((observer: any) => {
        	this.processOptions(url, body, options).then((req) => {
	        	req.type = 'post';
	            if(req.auth) {
	                this.http.post(req.url, req.body, req.options)
	                .map(res => res.json())
	                .subscribe(
	                    data => observer.next(data),
	                    err => this.error(err, req, observer),
	                    () => observer.complete()
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
    put(url: string, body?: any, options?: any){
        return new Observable((observer: any) => {
        	this.processOptions(url, body, options).then((req) => {
        		req.type = 'put';
	            if(req.auth) {
	                this.http.put(req.url, req.body, req.options)
	                .map(res => res.json())
	                .subscribe(
	                    data => observer.next(data),
	                    err => this.error(err, req, observer),
	                    () => observer.complete()
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
    delete(url: string, options?: any){
        return new Observable((observer: any) => {
	        this.processOptions(url, null, options).then((req) => {
		        req.type = 'delete';
	            this.http.delete(req.url, req.options)
	            .map(res => res.json())
	            .subscribe(
	                data => observer.next(data),
	                err => this.error(err, req, observer),
	                () => observer.complete()
	            );
            });
      	});
    }
    /**
     * Creates a MD5 hash of the given string
     * @param  {string} str String to hash
     * @return {string}     Returns a hash of the given string
     */
    hash(str: string){
        return <string>Md5.hashStr(str, false);
    }

    /**
     * Login to the system with the set details
     * @return {Promise<any>} Returns a promise which resolves with an access token
     */
    login(){
        if (this.login_promise === null) {
            if(this.debug) console.error('[COMPOSER][COMMS] Attempting login.');
            this.login_promise = new Promise((resolve, reject) => {
            	this.performLogin(resolve, reject);
            });
        }
        return this.login_promise;
    }

    performLogin(resolve, reject) {
        let oauth:any = this.oAuthService;
        if(!oauth || !oauth.clientId || oauth.clientId === '') {
        	setTimeout(() => {
        		this.performLogin(resolve, reject);
        	}, 500);
        	return;
        }
        oauth.hasValidAccessToken().then((valid) => {
        	if(valid) {
                if(this.debug) console.debug('[COMPOSER][COMMS] Valid access token availiable.');
                oauth.getAccessToken().then((token) => {
                    resolve(token);
                    setTimeout(() => { this.loginDone(); }, 100);
                });
        	} else {
                if(this.debug) console.debug(`[COMPOSER][COMMS] No valid access token available.`);
                	// Attempt to finish logging in
                oauth.tryLogin().then((status: any) => {
                		// Check if valid access token is available
                	oauth.hasValidAccessToken().then((valid) => {
                		if(valid) {
		                    if(this.debug) console.debug('[COMPOSER][COMMS] Valid access token availiable.');
		                    oauth.getAccessToken().then((token) => {
		                        resolve(token);
		                        setTimeout(() => { this.loginDone(); }, 100);
		                    });
		                } else {
		                	if(this.trust) {
                                if(this.debug) console.debug(`[COMPOSER][COMMS] Device is trusted`);
                                oauth.response_type = 'code';
                                this.store['local'].getItem(`${oauth.clientId}_refresh_token`).then((refresh) => {
	                                if(refresh || oauth.code){ // Refresh token exists
	                                    if(this.debug) console.debug('[COMPOSER][COMMS] Refresh token found. Refreshing access token...');
	                                    //Perform refresh
	                                    if(oauth.clientId === '') {
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
                                        if(this.debug) console.debug('[COMPOSER][COMMS] No Refresh Token or Code');
							        	let path = location.href;
							            if(location.hash.indexOf(path) >= 0 && location.href.indexOf(location.origin + '/#/') >= 0) {
							            	if(path.indexOf('?') >= 0) {
							            		path = path.split('?')[0];
							            	}
							            }
							            let here = path;
		                                this.store['local'].setItem(`oauth_redirect`, here);
		                                oauth.initImplicitFlow();
                                        setTimeout(() => { this.loginDone(); }, 100);
	                                }
                                });

		                	} else {
                                if(this.debug) console.debug('[COMPOSER][COMMS] Device is not trusted.');
                                oauth.response_type = 'token';
                                if(this.debug) console.debug('[COMPOSER][COMMS] Starting login process...');
					        	let path = location.href;
					            if(location.hash.indexOf(path) >= 0 && location.href.indexOf(location.origin + '/#/') >= 0) {
					            	if(path.indexOf('?') >= 0) {
					            		path = path.split('?')[0];
					            	}
					            }
					            let here = path;
                                this.store['local'].setItem(`oauth_redirect`, here);
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
     * Refreshs access token
     * @param  {any}    resolve Login promise resolve
     * @param  {any}    reject  Login promise reject
     * @param  {number}
     * @return {void}
     */
    refreshToken(resolve: any, reject: any, retries: number = 1) {
        let oauth:any = this.oAuthService;
        this.refresh = true;
        oauth.refresh_url.then((url: any) => {
            let tokens:any;
            this.http.post(url, '')
                .map(res => res.json())
                .subscribe(
                    data => tokens = data,
                    err => {
                        let err_codes = [0, 400, 401, 403]
                            // Try refresh with root client ID
                        if(err && (err_codes.indexOf(err.status) || (err.status == 0 && err.ok == false)) && url.indexOf(this.hash(`${location.origin}/oauth-resp.html`)) < 0 && retries < 10) {
                            if(this.debug) console.debug(`[COMPOSER][COMMS(S)] Failed token refresh request for ${url}`);
                            oauth.getRefreshToken().then((rt) => {
	                            oauth.redirectUri = `${location.origin}/oauth-resp.html`;
	                            oauth.clientId = this.hash(`${location.origin}/oauth-resp.html`);
	                            this.store['local'].getItem(`${oauth.clientId}_refresh_token`).then((rt_root) => {
		                            if(rt && !rt_root) {
		                                this.store['local'].setItem(`${oauth.clientId}_refresh_token`, rt);
		                            }
		                            setTimeout(() => {
		                                this.refreshToken(resolve, reject, retries+1);
		                            }, 500 * retries);
		                        });
                            });
                        } else {
                            this.processLoginError(err, reject);
                        }
                    }, () => {
                        if(this.debug) console.debug('[COMPOSER][COMMS] Got new tokens:', tokens);
                        this.updateToken(tokens, resolve);
                        setTimeout(() => { this.loginDone(); }, 100);
                    }
                );
        });
    }

    /**
     * Sets whether the user has logged in or not
     * @param  {boolean} status Logged in status
     * @return {void}
     */
    setLoginStatus(status: boolean) {
    	let oauth:any = this.oAuthService;
    	if(status === true) this.store['session'].setItem(`${oauth.clientId}_login`, 'true');
    	else this.store['session'].removeItem(`${oauth.clientId}_login`);
    }
    /**
     * Removes all authentication related keys from storage
     * @return {void}
     */
    clearStore() {
        let oauth:any = this.oAuthService;
        oauth.clearAuth();
    }

    /**
     * Called when login is completed
     * @return {void}
     */
    loginDone() {
    	this.cleanUrl();
        this.login_promise = null;
    }

    /**
     * Handles errors when attempting to login
     * @param  {any}    err    Error response from login attempt
     * @param  {any}    reject Login Promise reject function
     * @return {void}
     */
    processLoginError(err: any, reject: any) {
        let oauth:any = this.oAuthService;
        this.storeError('login', err);
            // Clear storage
        if(err.status == 400 || err.status == 401){
            if(this.debug) console.debug('[COMPOSER][COMMS] Error with credentials. Getting new credentials...');
            this.clearStore();
            this.oAuthService.code = undefined;
            setTimeout(() => { this.loginDone(); }, 100);
            this.login().then(() => {}, (err) => { reject(err); });
        } else {
            console.error(err);
            //reject(err);
            setTimeout(() => { location.reload(); }, 5000);
            setTimeout(() => { this.loginDone(); }, 100);
        }
    }
    /**
     * Checks if user is authorised
     * @param  {any}    cb_fn Callback function which is passed the response
     * @return {void}
     */
    checkAuth(cb_fn: any) {
        console.error('[COMPOSER][COMMS] Checking Auth.');
        if(this.login_promise === null) {
            let parts:any = this.oAuthService.loginUrl.split('/');
            let uri:any = parts.splice(0, 3).join('/');
            this.oAuthService.authorizationHeader().then((token: string) => {
	        	let headers = new Headers({ "Authorization": (token ? token : '') });
	            this.http.get(uri + '/auth/oauth/token/info', { headers: headers }).subscribe(
	                data => cb_fn(data),
	                err => this.processLoginError(err, () => {}),
	                () => {}
	            );
            })
        }
    }

    /**
     * Stores last couple errors in localStorage for debugging purposes
     * @param  {string}  type  Type of error
     * @param  {any}     error Error to store 
     * @return {void}
     */
     private storeError(type: string, error: any) {
        let days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        let months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'NOV', 'DEC'];
        let date = new Date();
        let hour: any = date.getHours();
        hour = hour < 10 ? '0' + hour : hour;
        let min: any = date.getMinutes();
        min = min < 10 ? '0' + min : min;
        let sec: any = date.getSeconds();
        sec = sec < 10 ? '0' + sec : sec;
        let now = `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${hour}:${min}:${sec}`;
        now = now.toLowerCase();
        this.store['local'].setItem((`${type}_error: ${now}`), JSON.stringify(error));
        this.store['local'].getItem(`${type}_error`).then((value) => {
        	let error_list: any[] = [];
        	if(value){
	        	error_list = JSON.parse(value);
	            if(error_list) {
	                error_list.push(now);
	                if(error_list.length >= MAX_ERROR_COUNT){
	                    for(let i = 0; i < error_list.length - MAX_ERROR_COUNT; i++) {
	                        this.store['local'].removeItem(`${type}_error: ${error_list[i]}`);
	                    }
	                    error_list.splice(0, error_list.length - MAX_ERROR_COUNT);
	                }
	            } else {
	                error_list = [now];
	            }
            } else {
                error_list = [now];
            }
            this.store['local'].setItem(`${type}_error`, JSON.stringify(error_list));
        });
    }
    /**
     * Replaces old tokens with new
     * @param  {any}    data    Object contain new tokens and expiry
     * @param  {any}    resolve Login resolve function
     * @return {void}
     */
    private updateToken(data: any, resolve: any){
        let oauth:any = this.oAuthService;
        if(data.access_token) this.store['local'].setItem(`${oauth.clientId}_access_token`, data.access_token);
        if(data.refresh_token) this.store['local'].setItem(`${oauth.clientId}_refresh_token`, data.refresh_token);
        if(data.expires_in) {
            let expiry:any = ((new Date()).getTime() + data.expires_in * 1000);
            this.store['local'].setItem(`${oauth.clientId}_expires_at`, expiry.toString());
        }
        resolve();
        setTimeout(() => { this.loginDone(); }, 100);
    }

    logout(){

    }
    /**
     * Get access token
     * @return {string} Returns access token
     */
    get token() {
        return this.login();
    }

    get hasToken() {
    	return this.oAuthService.hasValidAccessToken();
    }

    /**
     * Check whether or not the user is logged in
     * @return {[type]} [description]
     */
    isLoggedIn() {
        return this.token ? true : (this.refresh ? null : false);
    }

    /**
     * Handler for HTTP request errors
     * @param  {any}    err Request error
     * @param  {any}    req Request details
     * @param  {any}    obs Request observable
     * @return {void}
     */
    private error(err: any, req: any, obs:any) {
    	console.error(err, req);
        let hash = this.hash(req.url+req.body);
        if(!this.retry[hash]) this.retry[hash] = 0;
        if((err.status === 401 || (err.status === 0 && err.ok == false)) && this.retry[hash] < 10) {
            // Re-authenticate if authentication error.
            this.login()
                .then((res) => {
                    this.retry[hash] = this.retry[hash] ? this.retry[hash] + 1 : 1;
                    setTimeout(() => {
                        this.refresh = false;
                        if(req.type == 'get' || req.type == 'delete'){
                            this[req.type](req.url, req.options).subscribe(
                                (data: any) => obs.next(data),
                                (err: any) => obs.error(err),
                                () => { obs.complete(); this.retry[hash] = 0; }
                            );
                        } else {
                            this[req.type](req.url, req.body, req.options).subscribe(
                                (data: any) => obs.next(data),
                                (err: any) => obs.error(err),
                                () => { obs.complete(); this.retry[hash] = 0; }
                            );
                        }
                    }, 500 * this.retry[hash]);
                }, (err) => {
                	console.error('[COMPOSER][COMMS] Error logging in.');
                    this.clearStore();
                    location.reload();
                	console.error(err);
                    this.retry[hash] = 0;
                });
        } else { // Return error
        	console.error('[COMPOSER][COMMS] Error processing request.');
        	console.error(err);
            obs.error(err);
            this.retry[hash] = 0;
        }
    }
}
