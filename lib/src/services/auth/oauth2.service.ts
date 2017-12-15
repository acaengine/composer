/**
 * @Author: Alex Sorafumo
 * @Date:   19/10/2016 10:47 AM
 * @Email:  alex@yuion.net
 * @Filename: oauth2.service.ts
 * @Last modified by:   Alex Sorafumo
 * @Last modified time: 06/02/2017 11:21 AM
 */

import { Location } from '@angular/common';
import { Injectable } from '@angular/core';

import * as sha256 from 'fast-sha256';
import { Subject } from 'rxjs/Subject';

import { COMPOSER } from '../../settings';
import { DataStoreService } from '../data-store.service';

@Injectable()
export class OAuthService {

    public clientId = '';
    public redirectUri = '';
    public loginUrl = '';
    public loginRedirect = '';
    public scope = '';
    public rngUrl = '';
    public oidc = false;
    public options: any;
    public state = '';
    public issuer = '';
    public validationHandler: any;
    public logoutUrl = '';
    public response_type: string;
    public refreshUri = '';
    public code: string;
    public login_local: boolean = false;
    public login_obs: Subject<boolean>;
    public simple: boolean = false;
    private debug: boolean = false;
    private _storage: string = 'local';
    private run_flow: boolean = false;
    private needs_login: boolean = false;

    private access_token_promise: any = null;
    private refresh_token_promise: any = null;
    private valid_access_token_promise: any = null;
    private valid_id_token_promise: any = null;
    private auth_header_promise: any = null;

    constructor(private location: Location, private store: DataStoreService) {
        this.login_obs = new Subject<boolean>();
    }

    /**
     * Set the type of storage to use for OAuth
     * @param  {string} storage Storage to use Local or Session
     * @return {void}
     */
    public setStorage(storage: string) {
        this._storage = storage;
    }

    /**
     * Get generated a login URL with the set parameters
     * @return {string} Returns the generated login URL
     */
    get login_url() {
        return this.createLoginUrl('').then((url) => url);
    }

    /**
     * Get generated a refresh URL with the set parameters
     * @return {string} Returns the generated refresh URL
     */
    get refresh_url() {
        return this.createRefreshUrl('').then((url) => url, (err) => '');
    }

    public needsLogin() {
        setTimeout(() => this.login_obs.next(this.needs_login), 200);
        return this.login_obs;
    }

    /**
     * Try to process login
     * @param  {any}    options Login processing options
     * @return {Promise<boolean>} Returns Promise which resolves success of login
     */
    public tryLogin(options?: any) {
        return new Promise((resolve, reject) => {
            this.attemptLogin(options).then((i) => resolve(i), (e) => reject(e));
        });
    }

    public tryLoginWithIFrame() {
        throw new Error('tryLoginWithIFrame has not been implemented so far');
    }

    public tryRefresh(timeoutInMsec: any) {
        throw new Error('tryRefresh has not been implemented so far');
    }

    /**
     * Get the identity claims from storage
     * @return {string} Returns the identity claims
     */
    public getIdentityClaims() {
        const claims = this.store[this._storage].getItem(`${this.clientId}_id_token_claims_obj`)
            .then((res: string) => res);
        if (!claims) { return null; }
        return JSON.parse(claims);
    }

    /**
     * Get the id token from storage
     * @return {string} Returns the id token
     */
    public getIdToken() {
        return this.store[this._storage].getItem(`${this.clientId}_id_token`).then((res: string) => res);
    }

    /**
     * Get the access token from storage
     * @return {string} Returns the access token
     */
    public getAccessToken() {
        if (!this.access_token_promise) {
            this.access_token_promise = new Promise((resolve) => {
                this.store[this._storage].getItem(`${this.clientId}_access_token`).then((token: string) => {
                    if (!token) {
                        this.store[this._storage].getItem(`accessToken`).then((token_local: string) => {
                            resolve(token_local);
                            this.access_token_promise = null;
                        });
                    } else {
                        resolve(token);
                        this.access_token_promise = null;
                    }
                });
            });
        }
        return this.access_token_promise;
    }
    /**
     * Get the access token from storage
     * @return {string} Returns the access token
     */
    public getRefreshToken() {
        if (!this.refresh_token_promise) {
            this.refresh_token_promise = new Promise((resolve) => {
                this.store[this._storage].getItem(`${this.clientId}_refresh_token`).then((token: string) => {
                    if (!token) {
                        this.store[this._storage].getItem(`refreshToken`).then((token_local: string) => {
                            resolve(token_local);
                            this.refresh_token_promise = null;
                        });
                    } else {
                        resolve(token);
                        this.refresh_token_promise = null;
                    }
                });
            });
        }
        return this.refresh_token_promise;
    }

    /**
     * Checks to see if access token is still valid
     * @return {boolean} Returns the expiry state of the access token
     */
    public hasValidAccessToken() {
        if (!this.valid_access_token_promise) {
            this.valid_access_token_promise = new Promise<boolean>((resolve, reject) => {
                this.getAccessToken().then((token: string) => {
                    this.store[this._storage].getItem(`${this.clientId}_expires_at`).then((expiresAt: string) => {
                        setTimeout(() => {
                            this.valid_access_token_promise = null;
                        }, 10);
                        if (!expiresAt) {
                            this.store[this._storage].getItem(`accessExpiry`).then((expiresAt_local: string) => {
                                const now = new Date();
                                if (!expiresAt || parseInt(expiresAt_local, 10) < now.getTime()) {
                                    return resolve(false);
                                }
                                return resolve(true);
                            });
                        } else {
                            const now = new Date();
                            if (expiresAt && parseInt(expiresAt, 10) < now.getTime()) {
                                return resolve(false);
                            }
                            return resolve(true);
                        }
                    });
                });
            });
        }
        return this.valid_access_token_promise;
    }

    public hasValidIdToken() {
        if (!this.valid_id_token_promise) {
            this.valid_id_token_promise = new Promise<boolean>((resolve, reject) => {
                if (this.getIdToken) {
                    this.store[this._storage].getItem(`${this.clientId}_id_token_expires_at`)
                        .then((expiresAt: string) => {
                            const now = new Date();
                            if (expiresAt && parseInt(expiresAt, 10) < now.getTime()) {
                                return resolve(false);
                            } else {
                                return resolve(true);
                            }
                        });
                } else {
                    resolve(false);
                }
            });
        }
    }

    /**
     * Get the authorisation header to add to requests
     * @return {string} Returns authorisation header
     */
    public authorizationHeader() {
        if (!this.auth_header_promise) {
            this.auth_header_promise = new Promise<string>((resolve) => {
                this.getAccessToken().then((token: string) => {
                    resolve(`Bearer ${token}`);
                    setTimeout(() => { this.auth_header_promise = null; }, 1000);
                });
            });
        }
        return this.auth_header_promise;
    }

    /**
     * Clears storage and redirects to logout URL
     * @return {void}
     */
    public logOut() {
        COMPOSER.log('OAUTH', 'Logging out. Clear access tokens...');
        const id_token = this.getIdToken();
        this.clearAuth();
        if (!this.logoutUrl) {
            setTimeout(() => {
                this.location.replaceState(this.location.path(), '');
            }, 100);
            return;
        }

        const logoutUrl = this.logoutUrl.replace(/\{\{id_token\}\}/, id_token);
        COMPOSER.log('OAUTH', 'Redirecting to logout URL...');
        location.href = logoutUrl;
    }
    /**
     * Removes any auth related details from storage
     * @return {void}
     */
    public clearAuth() {
        COMPOSER.log('OAUTH', `Clearing authentication variables...`);
        const items = [
            'access_token', 'refresh_token', 'accesstoken', 'refreshtoken',
            'id_token', 'idtoken', 'nonce', 'expires', 'expiry', 'login', 'oauth',
        ];
        this.store[this._storage].keys().then((keys) => {
            for (const key of keys) {
                const lkey = key.toLowerCase();
                for (const i of items) {
                    if (lkey.indexOf(i) >= 0) {
                        this.store[this._storage].removeItem(key);
                        COMPOSER.log('OAUTH', `Remove key '${key}' from ${this._storage} storage`);
                        break;
                    }
                }
            }
        });
    }

    /**
     * Generates a login URL with the set parameters
     * @param  {any}    state OAuth State
     * @return {string} Returns a generated login URL
     */
    private createLoginUrl(state: any) {
        const that = this;

        if (typeof state === 'undefined') { state = ''; }

        return this.createAndSaveNonce().then((nonce: any) => {

            if (state) { state = nonce + ';' + state; }
            else { state = nonce; }

            let response_type = this.response_type ? this.response_type : 'token';

            if (this.oidc) {
                response_type = 'id_token+' + response_type;
            }

            let url = this.loginUrl
                + (this.loginUrl.indexOf('?') < 0 ? '?' : '&') + 'response_type='
                + encodeURIComponent(response_type)
                + '&client_id='
                + encodeURIComponent(this.clientId)
                + '&state='
                + encodeURIComponent(state)
                + '&redirect_uri='
                + encodeURIComponent(this.redirectUri)
                + '&scope='
                + encodeURIComponent(this.scope);

            if (this.oidc) {
                url += '&nonce=' + encodeURIComponent(nonce);
            }

            return url;
        });
    }
    /**
     * Generates a refresh URL with the set parameters
     * @param  {any}    state OAuth State
     * @return {string} Returns a generated refresh URL
     */
    private createRefreshUrl(state: any) {
        if (typeof state === 'undefined') { state = ''; }

        return this.createAndSaveNonce().then((nonce: any) => {
            let url = this.refreshUri
                + '?client_id='
                + encodeURIComponent(this.clientId)
                + '&redirect_uri='
                + encodeURIComponent(this.redirectUri);
            return this.store[this._storage].getItem(`${this.clientId}_refresh_token`)
                .then((refresh_token: string) => {
                    if (!refresh_token) {
                        return this.store[this._storage].getItem(`refreshToken`).then((refresh_token_local: string) => {
                            if (refresh_token_local) {
                                url += `&refresh_token=${encodeURIComponent(refresh_token_local)}`;
                                url += `&grant_type=${encodeURIComponent('refresh_token')}`;
                                return url;
                            } else {
                                url += `&code=${encodeURIComponent(this.code)}&`;
                                url += `grant_type=${encodeURIComponent('authorization_code')}`;
                                return url;
                            }
                        });
                    } else {
                        url += `&refresh_token=${encodeURIComponent(refresh_token)}`;
                        url += `&grant_type=${encodeURIComponent('refresh_token')}`;
                        return url;
                    }
                });
        });
    }

    /**
     * Starts process to login and get OAuth tokens
     * @param  {string} additionalState OAuth State
     * @return {void}
     */
    private initImplicitFlow(additionalState: string = '') {
        if (!this.clientId || this.clientId === '' || this.run_flow) {
            return;
        }
        this.createLoginUrl(additionalState).then((url) => {
            let path = location.href;
            if (location.hash.indexOf(path) >= 0 && location.href.indexOf(location.origin + '/#/') >= 0) {
                if (path.indexOf('?') >= 0) {
                    path = path.split('?')[0];
                }
            }
            const here = path;
            this.store.local.setItem(`oauth_redirect`, here);
            this.run_flow = true;
            this.store.session.getItem(`${this.clientId}_login`).then((logged: string) => {
                if (logged === 'true' && url.indexOf('http') >= 0) {
                    COMPOSER.log('OAUTH', 'Logged in. Authorizing...');
                    this.store.session.removeItem(`${this.clientId}_login`);
                    location.href = url;
                } else {
                    COMPOSER.log('OAUTH', 'Not logged in redirecting to provider...');
                    this.needs_login = true;
                    if (this.login_local) {
                        this.login_obs.next(this.needs_login);
                        this.run_flow = false;
                    } else {
                        this.store.session.setItem(`${this.clientId}_login`, 'true');
                        if (!this.loginRedirect || this.loginRedirect === '' && location.origin.indexOf('http') >= 0) {
                            this.loginRedirect = location.origin + '/auth/login';
                        } else if (this.loginRedirect && this.loginRedirect !== '') {
                            COMPOSER.log('OAUTH', `Login: ${this.loginRedirect}`);
                            location.href = this.loginRedirect;
                        }
                    }
                }
            });
        }, (err) => {
            return;
        });
    }

    private callEventIfExists(options: any) {
        const that = this;
        if (options.onTokenReceived) {
            const tokenParams = {
                idClaims: that.getIdentityClaims(),
                idToken: that.getIdToken(),
                accessToken: that.getAccessToken(),
                state: that.state,
            };
            options.onTokenReceived(tokenParams);
        }
    }

    /**
     * Attempts to process login information
     * @param  {any}    options Login processing options
     * @param  {any}    resolve Promise resolve
     * @param  {any}    reject  Promise reject
     * @return {void}
     */
    private attemptLogin(options: any, tries: number = 0) {
        return new Promise((resolve, reject) => {
            if (tries > 10) { return resolve(); }
            if (this.clientId && this.clientId !== '') {
                options = options || {};

                let parts = this.getFragment();
                if (Object.keys(parts).length <= 1) {
                    this.store.session.getItem('OAUTH.params').then((item: string) => {
                        if (item) {
                            parts = JSON.parse(item);
                        }
                        this.store.session.removeItem('OAUTH.params');
                        this.processLogin(parts, options).then((i) => resolve(i), (e) => reject(e));
                    });
                } else {
                    this.processLogin(parts, options).then((i) => resolve(i), (e) => reject(e));
                }
            } else {
                setTimeout(() => {
                    this.attemptLogin(options, ++tries).then((i) => resolve(i), (e) => reject(e));
                }, 200);
            }
        });
    }

    private processLogin(parts: any, options: any) {
        return new Promise((resolve, reject) => {
            const accessToken = parts.access_token;
            const idToken = parts.id_token;
            const state = parts.state;
            const code = parts.code;
            const refreshToken = parts.refreshToken;
            COMPOSER.log('OAUTH', `State: ${state}`);
            COMPOSER.log('OAUTH', `Access: ${accessToken} | Refresh: ${accessToken}`);

            const oidcSuccess = false;
            let oauthSuccess = false;

            if ((!accessToken && !code && !refreshToken) || !state) { return resolve(false); }
            if (this.oidc && !idToken) { return resolve(false); }

            if (code) { this.code = code; }
            if (refreshToken) {
                this.store[this._storage].setItem(`${this.clientId}_refresh_token`, refreshToken);
            }

            this.store[this._storage].getItem(`${this.clientId}_nonce`)
                .then((savedNonce: string) => {
                    const stateParts = state.split(';');
                    const nonceInState = stateParts[0];
                    if (savedNonce === nonceInState) {
                        if (accessToken) {
                            this.store[this._storage].setItem(`${this.clientId}_access_token`, accessToken);
                        }

                        const expiresIn = parts.expires_in;

                        if (expiresIn) {
                            const expiresInMilliSeconds = parseInt(expiresIn, 10) * 1000;
                            const now = new Date();
                            const expiresAt = now.getTime() + expiresInMilliSeconds;
                            this.store[this._storage].setItem(`${this.clientId}_expires_at`, '' + expiresAt);
                        }
                        if (stateParts.length > 1) { this.state = stateParts[1]; }
                        oauthSuccess = true;
                    }

                    if (!oauthSuccess) { return resolve(false); }
                    if (!this.oidc && options.onTokenReceived) {
                        options.onTokenReceived({ accessToken });
                    }

                    if (this.oidc) {
                        this.processIdToken(idToken, accessToken).then((success: string) => {
                            if (!success) {
                                return resolve(false);
                            }
                        });
                    }

                    if (options.validationHandler) {
                        const validationParams = { accessToken, idToken };
                        options.validationHandler(validationParams)
                            .then(() => this.callEventIfExists(options))
                            .catch((reason: any) => {
                                COMPOSER.error('OAUTH', 'Error validating tokens', reason);
                            });
                    } else {
                        this.callEventIfExists(options);
                    }
                    // NEXT VERSION: Notify parent-window (iframe-refresh)
                    /*
                    let win = window;
                    if (win.parent && win.parent.onOAuthCallback) {
                        win.parent.onOAuthCallback(this.state);
                    }
                    */

                    // Clean up after token has been received
                    this.store[this._storage].removeItem('oauth_redirect');
                    this.store[this._storage].setItem('oauth_finished', 'true');
                    this.location.replaceState(this.location.path());
                    return resolve(true);
                });
        });
    }
    /**
     * Process tokens
     * @param  {any}    idToken     ID Token
     * @param  {any}    accessToken Access Token
     * @return {boolean} Returns success of processing id token
     */
    private processIdToken(idToken: any, accessToken: any) {
        return new Promise((resolve) => {
            const tokenParts = idToken.split('.');
            const claimsBase64 = this.padBase64(tokenParts[1]);
            const claimsJson = ''; // Base64.decode(claimsBase64);
            const claims = JSON.parse(claimsJson);
            this.store[this._storage].getItem(`${this.clientId}_nonce`).then((savedNonce: string) => {

                if (claims.aud !== this.clientId) {
                    COMPOSER.log('OAUTH', 'Wrong audience: ' + claims.aud, null, 'warn');
                    return resolve(false);
                }

                if (this.issuer && claims.iss !== this.issuer) {
                    COMPOSER.log('OAUTH', 'Wrong issuer: ' + claims.iss, null, 'warn');
                    return resolve(false);
                }

                if (claims.nonce !== savedNonce) {
                    COMPOSER.log('OAUTH', 'Wrong nonce: ' + claims.nonce, null, 'warn');
                    return resolve(false);
                }

                if (accessToken && !this.checkAtHash(accessToken, claims)) {
                    COMPOSER.log('OAUTH', 'Wrong at_hash', null, 'warn');
                    return resolve(false);
                }

                // Das Prüfen des Zertifikates wird der Serverseite überlassen!

                const now = Date.now();
                const issuedAtMSec = claims.iat * 1000;
                const expiresAtMSec = claims.exp * 1000;

                const tenMinutesInMsec = 1000 * 60 * 10;

                if (issuedAtMSec - tenMinutesInMsec >= now || expiresAtMSec + tenMinutesInMsec <= now) {
                    COMPOSER.log('OAUTH', 'Token has been expired', {
                        now,
                        issuedAtMSec,
                        expiresAtMSec,
                    });
                    return resolve(false);
                }

                this.store[this._storage].setItem(`${this.clientId}_id_token`, idToken);
                this.store[this._storage].setItem(`${this.clientId}_id_token_claims_obj`, claimsJson);
                this.store[this._storage].setItem(`${this.clientId}_id_token_expires_at`, '' + expiresAtMSec);

                if (this.validationHandler) {
                    this.validationHandler(idToken);
                }
                return resolve(true);
            });
        });
    }

    private padBase64(base64data: any) {
        while (base64data.length % 4 !== 0) {
            base64data += '=';
        }
        return base64data;
    }

    /**
     * Creates a nonce and stores it in storage
     * @return {string} Returns the created nonce
     */
    private createAndSaveNonce() {
        return this.createNonce().then((nonce: any) => {
            this.store[this._storage].setItem(`${this.clientId}_nonce`, nonce);
            return nonce;
        }, (err) => '');

    }

    /**
     * Generates a nonce
     * @return {Promise<string>} Returns a promise that resolve a nonce
     */
    private createNonce() {

        return new Promise<string>((resolve, reject) => {

            if (this.rngUrl) {
                throw new Error('createNonce with rng-web-api has not been implemented so far');
            } else {
                let text = '';
                const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

                for (let i = 0; i < 40; i++) {
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                }
                resolve(text);
            }

        });
    }
    /**
     * Breaks up URL hash/query into a key, value map
     * @return {any} Returns a map of key, value pairs from the URL hash/query
     */
    private getFragment() {
        const path = this.location.path();
        if (location.hash.includes('#') && !location.hash.includes(path)) {
            return this.parseQueryString(location.hash.substr(1));
        } else if (location.search.includes('?')) {
            return this.parseQueryString(location.search.substr(1));
        }
        return {};
    }

    /**
     * Parses query string and generates a map of the parameters
     * @param  {string}    queryString Query or hash string
     * @return {any} Returns a map of key, value pairs from the query string
     */
    private parseQueryString(queryString: string) {
        const data: any = {};
        let pairs: any;
        let pair: any;
        let separatorIndex: any;
        let escapedKey: any;
        let escapedValue: any;
        let key: any;
        let value: any;

        if (queryString === null) {
            return data;
        }

        pairs = queryString.split('&');

        for (let i = 0; i < pairs.length; i++) {
            pair = pairs[i];
            separatorIndex = pair.indexOf('=');

            if (separatorIndex === -1) {
                escapedKey = pair;
                escapedValue = null;
            } else {
                escapedKey = pair.substr(0, separatorIndex);
                escapedValue = pair.substr(separatorIndex + 1);
            }

            key = decodeURIComponent(escapedKey);
            value = decodeURIComponent(escapedValue);

            if (key.substr(0, 1) === '/') {
                key = key.substr(1);
            }

            data[key] = value;
        }

        return data;
    }

    /**
     * Checks if claims and tokens correctly in hash
     * @param  {any}    accessToken Access Token
     * @param  {any}    idClaims    ID Claims
     * @return {boolean} Returns claims and tokens correctly in hash
     */
    private checkAtHash(accessToken: any, idClaims: any) {
        if (!accessToken || !idClaims || !idClaims.at_hash) {
            return true;
        }
        const tokenHash: any[] = []; // toByteArrayFunc(sha256.hash(accessToken));
        const leftMostHalf = tokenHash.slice(0, (tokenHash.length / 2));
        const tokenHashBase64 = ''; // fromByteArrayFunc(leftMostHalf);
        const atHash = tokenHashBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        const claimsAtHash = idClaims.at_hash.replace(/=/g, '');

        if (atHash !== claimsAtHash) {
            COMPOSER.log('OAUTH', 'exptected at_hash: ' + atHash, null, 'warn');
            COMPOSER.log('OAUTH', 'actual at_hash: ' + claimsAtHash, null, 'warn');
        }

        return (atHash === claimsAtHash);
    }

}
