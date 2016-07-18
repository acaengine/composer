import { Injectable, Inject } from '@angular/core';
import { Location } from '@angular/common';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';

import { OAuthService } from './oauth2.service';
import { Md5 } from 'ts-md5/dist/md5'

@Injectable()
export class ACAHttp {
    private trust: boolean = true;
    private sub: any;
    private store: any = localStorage;
    private refresh = false;
    private loginPromise: Promise<any> = null;

    constructor(private location: Location, private router: Router, private http: Http, private oAuthService: OAuthService){
        this.setupOAuth(
            `${window.location.origin}/auth/oauth/authorize`,
            `${window.location.origin}/auth/token`,
            `${window.location.origin}/oauth-resp.html`,
            this.hash(`${window.location.origin}/oauth-resp.html`)
        );
        //*
        this.sub = this.router
        .routerState
        .queryParams
        .subscribe(params => {
            this.trust = params['trust'] ? params['trust'] : this.trust;
        });
        //*/
    }

    setupOAuth(url: string, refresh: string, redirect: string, c_id: string, issuer?: string, scope?: string, oidc?: boolean, logout?: string) {
        let oauth = this.oAuthService;
        oauth.loginUrl = url;
        oauth.refreshUri = refresh;
        oauth.redirectUri = redirect;
        oauth.clientId = c_id;
        oauth.issuer = issuer ? issuer : (oauth.issuer ? oauth.issuer : '');
        oauth.scope = scope ? scope : (oauth.scope ? oauth.scope : '');
        oauth.oidc = oidc ? oidc : (oauth.oidc ? oauth.oidc : false);
        oauth.logoutUrl = logout ? logout : (oauth.logoutUrl ? oauth.logoutUrl : '/logout');
    }

    tryLogin() {
        if(this.oAuthService.code) this.login().then(() => {
            console.log('OAuth: Got Access Token.')
            this.cleanUrl();
        });
    }

    private cleanUrl() {
        let redirect: any = this.store.getItem('oauth_redirect');
        let loc = '/';
        if(redirect){
            redirect = redirect.split('/');
            redirect.splice(0, 3);
            redirect = redirect.join('/');
            loc = '/' + redirect;
        }
        this.location.replaceState(loc);
        this.store.removeItem('oauth_redirect');
    }

    processOptions(url: string, body?: any, options?: any) {
        let hds = { "Authorization": this.oAuthService ? this.oAuthService.authorizationHeader() : '' };
        if(options && !options.headers){
            for(var i in options) hds[i] = options[i];
        }
        let headers = new Headers(hds);
            // Store request info for retry if needed.
        let req = {
            type: 'get',
            body: body,
            url: url,
            options : null
        };
        if(!req.options) req.options = { headers: headers};
        else if(!req.options.headers) req.options.headers = headers;
        return req;
    }

    get(url: string, options?: any) {
        let req = this.processOptions(url, null, options);
        return new Observable(observer => {
            this.http.get(req.url, req.options)
            .map(res => res.json())
            .subscribe(
                data => observer.next(data),
                err => this.error(err, req, observer),
                () => observer.complete()
            );
      });
    }

    post(url: string, body?: any, options?: any) {
        let req = this.processOptions(url, body, options);
        req.type = 'post';
        return new Observable(observer => {
            this.http.post(req.url, req.body, req.options)
            .map(res => res.json())
            .subscribe(
                data => observer.next(data),
                err => this.error(err, req, observer),
                () => observer.complete()
            );
      });
    }

    put(url: string, body?: any, options?: any){
        let req = this.processOptions(url, body, options);
        req.type = 'put';
        return new Observable(observer => {
            this.http.put(req.url, req.body, req.options)
            .map(res => res.json())
            .subscribe(
                data => observer.next(data),
                err => this.error(err, req, observer),
                () => observer.complete()
            );
      });
    }

    delete(url: string, options?: any){
        let req = this.processOptions(url, null, options);
        req.type = 'delete';
        return new Observable(observer => {
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
            console.log('OAuth: Attempting Login.');
            this.loginPromise = new Promise((resolve, reject) => {
                let oauth:any = this.oAuthService;
                oauth.tryLogin();
                if(this.trust){ // Location is trusted
                    oauth.response_type = 'code';
                    if(this.store.getItem(`${oauth.clientId}_refresh_token`) || oauth.code){ // Refresh token exists
                        if(!this.tokenValid()){
                            console.log('OAuth: No Valid Access Token. Refreshing...');
                                //Perform refresh
                            this.refresh = true;
                            oauth.refresh_url.then((url: any) => {
                                let tokens:any;
                                this.http.post(url, '')
                                    .map(res => res.json())
                                    .subscribe(
                                        data => tokens = data,
                                        err => this.processLoginError(err, reject),
                                        () => this.updateToken(tokens, resolve)
                                    );
                            });
                        } else { // Token is still valid.
                            console.log('OAuth: Valid Access Token availiable.');
                            resolve(this.store.getItem(`${oauth.clientId}_access_token`));
                            setTimeout(() => { this.loginDone(); }, 100);
                        }
                    } else { // No refresh token
                        console.error('OAuth: No Refresh Token or Code');
                        this.store.setItem(`oauth_redirect`, window.location.href);
                        oauth.initImplicitFlow();
                    }
                } else { // Location not trusted
                    oauth.response_type = 'token';
                    console.log('OAuth: Location not trusted.');
                    this.store.setItem(`oauth_redirect`, window.location.href);
                    oauth.initImplicitFlow();
                    setTimeout(() => { this.loginDone(); }, 100);
                }
            });
        }
        return this.loginPromise;
    }

    loginDone() {
        this.loginPromise = null;
    }

    processLoginError(err, reject) {
        let oauth:any = this.oAuthService;
            // Clear storage
        if(err.status == 400 || err.status == 401 || (err.status == 0 && err.ok == false)){
            console.log('Error with credentials. Getting new credentials...');
            this.store.removeItem(`${oauth.clientId}_access_token`);
            this.store.removeItem(`${oauth.clientId}_refresh_token`);
            this.store.removeItem(`${oauth.clientId}_expires_at`);
            this.store.removeItem(`${oauth.clientId}_nonce`);
            this.oAuthService.code = undefined;
            setTimeout(() => { this.loginDone(); }, 100);
            this.login().then(() => {}, (err) => { reject(err); });
        } else {
            console.error(err);
            //reject(err);
            setTimeout(window.location.reload, 2000);
            setTimeout(() => { this.loginDone(); }, 100);
        }
    }

    checkAuth(cb_fn) {
        console.log('OAuth: Checking Auth.');
        if(this.loginPromise === null) {
            let parts:any = this.oAuthService.loginUrl.split('/');
            let uri:any = parts.splice(0, 3).join('/');
            this.http.get(uri + '/auth/oauth/token/info').subscribe(
                data => cb_fn(data),
                err => this.processLoginError(err, () => {}),
                () => {}
            );
        }
    }

    private updateToken(data, resolve){
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
        if(err.status == 401) { // Re-authenticate if authentication error.
            //*
            this.login()
                .then((res) => {
                    this.refresh = false;
                    if(req.type == 'get' || req.type == 'delete'){
                        this[req.type](req.url, req.options).subscribe(
                            data => obs.next(data),
                            err => obs.error(err),
                            () => obs.complete()
                        );
                    } else {
                        this[req.type](req.url, req.body, req.options).subscribe(
                            data => obs.next(data),
                            err => obs.error(err),
                            () => obs.complete()
                        );
                    }
            });
            //*/
        } else { // Return error
            obs.error(err);
        }
    }
}
