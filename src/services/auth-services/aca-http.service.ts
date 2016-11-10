import { Injectable, Inject } from '@angular/core';
import { Location } from '@angular/common';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Router, ActivatedRoute } from '@angular/router';

import { OAuthService } from './oauth2.service';
import { Md5 } from 'ts-md5/dist/md5'

@Injectable()
export class ACAHttp {
    private trust: boolean = false;
    private sub: any;
    private store: any = localStorage;
    private refresh = false;
    private loginPromise: Promise<any> = null;

    constructor(private location: Location, private route: ActivatedRoute, private router: Router, private http: Http, private oAuthService: OAuthService){
        //*
        this.sub = this.route.queryParams.subscribe( (params: any) => {
            this.trust = params['trust'] === 'true' ? params['trust'] === 'true' : this.trust;
            if(sessionStorage) {
                sessionStorage.setItem(`trust`, this.trust ? 'true': 'false');
            }
        });
        //*/
    }

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
        oauth.logoutUrl = logout ? logout : (oauth.logoutUrl ? oauth.logoutUrl : '/logout');
        if(sessionStorage) {
            this.trust = (sessionStorage.getItem(`trust`) === 'true');
        }
        this.login().then(() => {

        }, () => {

        });
    }

    tryLogin() {
        if(window['debug'] && window['debug_module'].indexOf('COMPOSER_HTTP') >= 0) console.debug('COMPOSER | HTTP: Trying Login');
        if(this.oAuthService.code) this.login().then(() => {
            if(window['debug'] && window['debug_module'].indexOf('COMPOSER_HTTP') >= 0) console.debug('COMPOSER | HTTP: Got Access Token.');
        });
    }

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

    hash(str: string){
        return <string>Md5.hashStr(str, false);
    }

    login(){
        if (this.loginPromise === null) {
            if(window['debug'] && window['debug_module'].indexOf('COMPOSER_HTTP') >= 0) console.debug('COMPOSER | HTTP: Attempting login.');
            this.loginPromise = new Promise((resolve, reject) => {
                let oauth:any = this.oAuthService;
                oauth.tryLogin().then((status: any) => {
                    if(this.trust){ // Location is trusted
                        oauth.response_type = 'code';
                        if(this.store.getItem(`${oauth.clientId}_refresh_token`) || oauth.code){ // Refresh token exists
                            if(!this.tokenValid()){
                                if(window['debug'] && window['debug_module'].indexOf('COMPOSER_HTTP') >= 0) console.debug('COMPOSER | HTTP: No valid access token. Refreshing...');
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
                                if(window['debug'] && window['debug_module'].indexOf('COMPOSER_HTTP') >= 0) console.debug('COMPOSER | HTTP: Valid Access Token availiable.');
                                resolve(this.store.getItem(`${oauth.clientId}_access_token`));
                                setTimeout(() => { this.loginDone(); }, 100);
                            }
                        } else { // No refresh token
                            if(window['debug'] && window['debug_module'].indexOf('COMPOSER_HTTP') >= 0) console.debug('COMPOSER | HTTP: No Refresh Token or Code');
                            this.store.setItem(`oauth_redirect`, window.location.href);
                            oauth.initImplicitFlow();
                            setTimeout(() => { this.loginDone(); }, 100);
                        }
                    } else { // Location not trusted
                        if(!this.tokenValid()){
                            oauth.response_type = 'token';
                            if(window['debug'] && window['debug_module'].indexOf('COMPOSER_HTTP') >= 0) console.debug('COMPOSER | HTTP: Location not trusted.');
                            this.store.setItem(`oauth_redirect`, window.location.href);
                            oauth.initImplicitFlow();
                            setTimeout(() => { this.loginDone(); }, 100);
                        } else {
                            if(window['debug'] && window['debug_module'].indexOf('COMPOSER_HTTP') >= 0) console.debug('COMPOSER | HTTP: Valid Access Token availiable.');
                            resolve(this.store.getItem(`${oauth.clientId}_access_token`));
                            setTimeout(() => { this.loginDone(); }, 100);
                        }
                    }
                }, (err: any) => {});
            });
        }
        return this.loginPromise;
    }

    refreshToken(resolve: any, reject: any) {
        let oauth:any = this.oAuthService;
        this.refresh = true;
        oauth.refresh_url.then((url: any) => {
            let tokens:any;
            this.http.post(url, '')
                .map(res => res.json())
                .subscribe(
                    data => tokens = data,
                    err => this.processLoginError(err, reject),
                    () => {
                        if(window['debug'] && window['debug_module'].indexOf('COMPOSER_HTTP') >= 0) console.debug('COMPOSER | HTTP: ', tokens);
                        this.updateToken(tokens, resolve);
                        setTimeout(() => { this.loginDone(); }, 100);
                    }
                );
        });
    }

    setLoginStatus(status: boolean = true) {
    	if(sessionStorage) {
        	let oauth:any = this.oAuthService;
	    	if(status) sessionStorage.setItem(`${oauth.clientId}_login`, 'true');
	    	else sessionStorage.removeItem(`${oauth.clientId}_login`);
	    }
    }

    clearStore() {
        let oauth:any = this.oAuthService;
        this.store.removeItem(`${oauth.clientId}_access_token`);
        this.store.removeItem(`${oauth.clientId}_refresh_token`);
        this.store.removeItem(`${oauth.clientId}_expires_at`);
        this.store.removeItem(`${oauth.clientId}_nonce`);
        this.store.removeItem(`${oauth.clientId}_login`);
    }

    loginDone() {
        this.loginPromise = null;
        this.cleanUrl();
    }

    processLoginError(err: any, reject: any) {
        let oauth:any = this.oAuthService;
            // Clear storage
        if(err.status == 400 || err.status == 401 || (err.status == 0 && err.ok == false)){
            if(window['debug'] && window['debug_module'].indexOf('COMPOSER_HTTP') >= 0) console.debug('COMPOSER | HTTP: Error with credentials. Getting new credentials...');
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

    checkAuth(cb_fn: any) {
        console.error('COMPOSER | HTTP: Checking Auth.');
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

    get token() {
        return this.login();
    }

    isLoggedIn() {
        return this.token ? true : (this.refresh ? null : false);
    }

    private error(err: any, req: any, obs:any) {
        if(err.status == 401 || err.status == 0) {
            // Re-authenticate if authentication error.
            this.login()
                .then((res) => {
                    setTimeout(() => {
                        this.refresh = false;
                        if(req.type == 'get' || req.type == 'delete'){
                            this[req.type](req.url, req.options).subscribe(
                                (data: any) => obs.next(data),
                                (err: any) => obs.error(err),
                                () => obs.complete()
                            );
                        } else {
                            this[req.type](req.url, req.body, req.options).subscribe(
                                (data: any) => obs.next(data),
                                (err: any) => obs.error(err),
                                () => obs.complete()
                            );
                        }
                    }, 500);
                }, (err) => {
                	console.error('COMPOSER | HTTP: Error logging in.');
                    this.clearStore();
                    location.reload();
                	console.error(err);
                });
        } else { // Return error
        	console.error('COMPOSER | HTTP: Error processing request.');
        	console.error(err);
            obs.error(err);
        }
    }
}
