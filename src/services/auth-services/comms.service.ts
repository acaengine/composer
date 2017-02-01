/**
* @Author: Alex Sorafumo
* @Date:   19/10/2016 10:47 AM
* @Email:  alex@yuion.net
* @Filename: aca-http.service.ts
* @Last modified by:   Alex Sorafumo
* @Last modified time: 01/02/2017 8:40 AM
*/

import { Injectable, Inject } from '@angular/core';
import { Location } from '@angular/common';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Router, ActivatedRoute } from '@angular/router';

import { OAuthService } from './oauth2.service';
import { Md5 } from 'ts-md5/dist/md5'

@Injectable()
export class CommsService {
    private trust: boolean = false;
    private sub: any;
    private store: any = localStorage;
    private refresh = false;
    private loginPromise: Promise<any> = null;
    private retry: any = {};

    constructor(private location: Location, private route: ActivatedRoute, private router: Router, private http: Http, private oAuthService: OAuthService){
        if(sessionStorage) {
            this.trust = (sessionStorage.getItem(`trust`) === 'true');
        }
        //*
        this.sub = this.route.queryParams.subscribe( (params: any) => {
            this.trust = params['trust'] === 'true' ? params['trust'] === 'true' : this.trust;
            if(sessionStorage) {
                sessionStorage.setItem(`trust`, this.trust ? 'true': 'false');
            }
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
        if(window['debug']) console.debug('[COMPOSER][COMMS] Trying Login');
        if(this.oAuthService.code) this.login().then(() => {
            if(window['debug']) console.debug('[COMPOSER][COMMS] Got Access Token.');
        });
    }
    /**
     * Clean up URL after logging in so that the ugly hash/query is not displayed
     * @return {void}
     */
    private cleanUrl() {
        let redirect: any = this.store.getItem('oauth_redirect');
        let loc = '/';
        if(redirect){
        	let base_el = document.getElementsByTagName('base')[0];
        	let base = base_el ? (base_el.href ? base_el.href : '/') : '/';
        	if(location.pathname.indexOf(base) === 0) {
        		loc = location.pathname.replace(base, '');
        	}
            loc = this.location.path().split('?')[0].split('#')[0];
	        this.location.go(loc);
            setTimeout(() => {
	            this.store.removeItem('oauth_redirect');
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
        let auth_header = this.oAuthService ? this.oAuthService.authorizationHeader() : '';
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
    }

    /**
     * Wrapper for Angular 2 HTTP GET with auth
     * @param  {string} url     Request URL
     * @param  {any}    options Request Options
     * @return {Observable} Returns an observable which acts like the Http observable
     */
    get(url: string, options?: any) {
        let req = this.processOptions(url, null, options);
        return new Observable((observer: any) => {
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
    }

    /**
     * Wrapper for Angular 2 HTTP POST with auth
     * @param  {string} url     Request URL
     * @param  {any}    body    (Optional)Request Body
     * @param  {any}    options (Optional)Request Options
     * @return {Observable} Returns an observable which acts like the Http observable
     */
    post(url: string, body?: any, options?: any) {
        let req = this.processOptions(url, body, options);
        req.type = 'post';
        return new Observable((observer: any) => {
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
    }

    /**
     * Wrapper for Angular 2 HTTP PUT with auth
     * @param  {string} url     Request URL
     * @param  {any}    body    (Optional)Request Body
     * @param  {any}    options (Optional)Request Options
     * @return {Observable} Returns an observable which acts like the Http observable
     */
    put(url: string, body?: any, options?: any){
        let req = this.processOptions(url, body, options);
        req.type = 'put';
        return new Observable((observer: any) => {
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
    }

    /**
     * Wrapper for Angular 2 HTTP DELETE with auth
     * @param  {string} url     Request URL
     * @param  {any}    options (Optional)Request Options
     * @return {Observable} Returns an observable which acts like the Http observable
     */
    delete(url: string, options?: any){
        let req = this.processOptions(url, null, options);
        req.type = 'delete';
        return new Observable((observer: any) => {
            this.http.delete(req.url, req.options)
            .map(res => res.json())
            .subscribe(
                data => observer.next(data),
                err => this.error(err, req, observer),
                () => observer.complete()
            );
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
        if (this.loginPromise === null) {
            if(window['debug']) console.debug('[COMPOSER][COMMS] Attempting login.');
            this.loginPromise = new Promise((resolve, reject) => {
                let oauth:any = this.oAuthService;
                oauth.tryLogin().then((status: any) => {
                    if(window['debug']) console.debug(`[COMPOSER][COMMS] Device trusted: ${this.trust}`);
                    if(this.trust){ // Location is trusted
                        oauth.response_type = 'code';
                        let refresh_token = this.store.getItem(`${oauth.clientId}_refresh_token`);
                        if(!refresh_token) refresh_token = this.store.getItem(`refreshToken`);
                        if(refresh_token || oauth.code){ // Refresh token exists
                            if(!this.tokenValid()){
                                if(window['debug']) console.debug('[COMPOSER][COMMS] No valid access token. Refreshing...');
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
                            } else { // Token is still valid.
                                if(window['debug']) console.debug('[COMPOSER][COMMS] Valid Access Token availiable.');
                                let token = this.store.getItem(`${oauth.clientId}_access_token`);
                                if(!token) token = this.store.getItem(`accessToken`)
                                resolve(token);
                                setTimeout(() => { this.loginDone(); }, 100);
                            }
                        } else { // No refresh token
                            if(window['debug']) console.debug('[COMPOSER][COMMS] No Refresh Token or Code');
                            this.store.setItem(`oauth_redirect`, window.location.href);
                            oauth.initImplicitFlow();
                            setTimeout(() => { this.loginDone(); }, 100);
                        }
                    } else { // Location not trusted
                        if(!this.tokenValid()){
                            oauth.response_type = 'token';
                            if(window['debug']) console.debug('[COMPOSER][COMMS] Location not trusted.');
                            this.store.setItem(`oauth_redirect`, window.location.href);
                            oauth.initImplicitFlow();
                            setTimeout(() => { this.loginDone(); }, 100);
                        } else {
                            if(window['debug']) console.debug('[COMPOSER][COMMS] Valid Access Token availiable.');
                            let token = this.store.getItem(`${oauth.clientId}_access_token`);
                            if(!token) token = this.store.getItem(`accessToken`)
                            resolve(token);
                            setTimeout(() => { this.loginDone(); }, 100);
                        }
                    }
                }, (err: any) => {});
            });
        }
        return this.loginPromise;
    }

    /**
     * Refreshs access token
     * @param  {any}    resolve Login promise resolve
     * @param  {any}    reject  Login promise reject
     * @return {void}
     */
    refreshToken(resolve: any, reject: any) {
        let oauth:any = this.oAuthService;
        this.refresh = true;
        oauth.refresh_url.then((url: any) => {
            let tokens:any;
            this.http.post(url, '')
                .map(res => res.json())
                .subscribe(
                    data => tokens = data,
                    err => {
                            // Try refresh with root client ID
                        if(err /* && (err.status === 500 || err.status === 404) */ && url !== location.origin + '/oauth-resp.html') {
                            oauth.redirectUri = `${location.origin}/oauth-resp.html`;
                            oauth.clientId = this.hash(`${location.origin}/oauth-resp.html`);
                            setTimeout(() => {
                                this.refreshToken(resolve, reject);
                            }, 200);
                        } else {
                            this.processLoginError(err, reject);
                        }
                    }, () => {
                        if(window['debug']) console.debug('[COMPOSER][COMMS] Got new tokens:', tokens);
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
    	if(sessionStorage) {
        	let oauth:any = this.oAuthService;
	    	if(status === true) sessionStorage.setItem(`${oauth.clientId}_login`, 'true');
	    	else sessionStorage.removeItem(`${oauth.clientId}_login`);
	    }
    }
    /**
     * Removes all authentication related keys from storage
     * @return {void}
     */
    clearStore() {
        let oauth:any = this.oAuthService;
        this.store.removeItem(`${oauth.clientId}_access_token`);
        this.store.removeItem(`${oauth.clientId}_refresh_token`);
        this.store.removeItem(`${oauth.clientId}_expires_at`);
        this.store.removeItem(`${oauth.clientId}_nonce`);
        this.store.removeItem(`${oauth.clientId}_login`);
    }

    /**
     * Called when login is completed
     * @return {void}
     */
    loginDone() {
        this.loginPromise = null;
        this.cleanUrl();
    }

    /**
     * Handles errors when attempting to login
     * @param  {any}    err    Error response from login attempt
     * @param  {any}    reject Login Promise reject function
     * @return {void}
     */
    processLoginError(err: any, reject: any) {
        let oauth:any = this.oAuthService;
            // Clear storage
        if(err.status == 400 || err.status == 401 || (err.status == 0 && err.ok == false)){
            if(window['debug']) console.debug('[COMPOSER][COMMS] Error with credentials. Getting new credentials...');
            this.clearStore();
            this.oAuthService.code = undefined;
            setTimeout(() => { this.loginDone(); }, 100);
            this.login().then(() => {}, (err) => { reject(err); });
        } else if(!err){
            console.error(err);
            //reject(err);
            setTimeout(() => { window.location.reload(); }, 2000);
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
        if(this.loginPromise === null) {
            let parts:any = this.oAuthService.loginUrl.split('/');
            let uri:any = parts.splice(0, 3).join('/');
        	let headers = new Headers({ "Authorization": this.oAuthService ? this.oAuthService.authorizationHeader() : '' });
            this.http.get(uri + '/auth/oauth/token/info', { headers: headers }).subscribe(
                data => cb_fn(data),
                err => this.processLoginError(err, () => {}),
                () => {}
            );
        }
    }

    /**
     * Replaces old tokens with new
     * @param  {any}    data    Object contain new tokens and expiry
     * @param  {any}    resolve Login resolve function
     * @return {void}
     */
    private updateToken(data: any, resolve: any){
        let oauth:any = this.oAuthService;
        if(data.access_token) this.store.setItem(`${oauth.clientId}_access_token`, data.access_token);
        if(data.refresh_token) this.store.setItem(`${oauth.clientId}_refresh_token`, data.refresh_token);
        if(data.expires_in) {
            let expiry:any = ((new Date()).getTime() + data.expires_in * 1000);
            this.store.setItem(`${oauth.clientId}_expires_at`, expiry.toString());
        }
        resolve();
        setTimeout(() => { this.loginDone(); }, 100);
    }
    /**
     * Checks whether current access token is valid or not
     * @return {boolean} Returns validity of access token
     */
    tokenValid(){
        let valid:any = true;
        let oauth:any = this.oAuthService;
        let token:any = this.store.getItem(`${oauth.clientId}_access_token`);
        let expiry:any = this.store.getItem(`${oauth.clientId}_expires_at`);
        if(!token) valid = false;
        else if(+expiry <= (new Date).getTime()) valid = false;
        return valid
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
        let hash = this.hash(req.url+req.body);
        if(!this.retry[hash]) this.retry[hash] = 0;
        if((err.status === 401 || err.status === 0) && this.retry[hash] < 10) {
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
