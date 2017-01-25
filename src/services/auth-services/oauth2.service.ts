/**
* @Author: Alex Sorafumo
* @Date:   19/10/2016 10:47 AM
* @Email:  alex@yuion.net
* @Filename: oauth2.service.ts
* @Last modified by:   Alex Sorafumo
* @Last modified time: 25/01/2017 3:01 PM
*/

import { Injectable } from '@angular/core';
import { Location } from '@angular/common';

//*
import { Base64 } from './inc/js-base64';
import { fromByteArrayFunc, toByteArrayFunc } from './inc/base64-js';
import * as sha256 from "fast-sha256";

@Injectable()
export class OAuthService {

    public clientId = "";
    public redirectUri = "";
    public loginUrl = "";
    public loginRedirect = "";
    public scope = "";
    public rngUrl = "";
    public oidc = false;
    public options: any;
    public state = "";
    public issuer = "";
    public validationHandler: any;
    public logoutUrl = "";
    public response_type: string;
    public refreshUri = '';
    public code: string;

    constructor(private location: Location) {

    }

    /**
     * Set the type of storage to use for OAuth
     * @param  {Storage} storage Storage to use LocalStorage/SessionStorage
     * @return {void}
     */
    public setStorage(storage: Storage) {
        this._storage = storage;
    }

    private _storage: Storage = localStorage;
    /**
     * Generates a login URL with the set parameters
     * @param  {any}    state OAuth State
     * @return {string} Returns a generated login URL
     */
    createLoginUrl(state: any) {
        let that = this;

        if (typeof state === "undefined") { state = ""; }

        return this.createAndSaveNonce().then((nonce: any) => {

            if (state) {
                state = nonce + ";" + state;
            } else {
                state = nonce;
            }

            let response_type = this.response_type ? this.response_type : "token";

            if (this.oidc) {
                response_type = "id_token+" + response_type;
            }

            let url = this.loginUrl
                        + (this.loginUrl.indexOf('?') < 0 ? '?' : '&' ) + "response_type="
                        + encodeURIComponent(response_type)
                        + "&client_id="
                        + encodeURIComponent(this.clientId)
                        + "&state="
                        + encodeURIComponent(state)
                        + "&redirect_uri="
                        + encodeURIComponent(this.redirectUri)
                        + "&scope="
                        + encodeURIComponent(this.scope);

            if (this.oidc) {
                url += "&nonce=" + encodeURIComponent(nonce);
            }

            return url;
        });
    };
    /**
     * Generates a refresh URL with the set parameters
     * @param  {any}    state OAuth State
     * @return {string} Returns a generated refresh URL
     */
    createRefreshUrl(state: any) {
        if (typeof state === "undefined") { state = ""; }

        return this.createAndSaveNonce().then((nonce: any) => {
            let  url = this.refreshUri
                        + "?client_id="
                        + encodeURIComponent(this.clientId)
                        + "&redirect_uri="
                        + encodeURIComponent(this.redirectUri)
            let refresh_token = this._storage.getItem(`${this.clientId}_refresh_token`);
            if(!refresh_token) {
                refresh_token = this._storage.getItem(`refreshToken`);
            }
            if(refresh_token){
                url += `&refresh_token=${encodeURIComponent(refresh_token)}&grant_type=${encodeURIComponent('refresh_token')}`;
            } else {
                url += `&code=${encodeURIComponent(this.code)}&grant_type=${encodeURIComponent('authorization_code')}`;
            }

            return url;
        });
    };

    /**
     * Get generated a login URL with the set parameters
     * @return {string} Returns the generated login URL
     */
    get login_url() {
        return this.createLoginUrl("").then((url) => {
            return url;
        })
    }

    /**
     * Get generated a refresh URL with the set parameters
     * @return {string} Returns the generated refresh URL
     */
    get refresh_url() {
        return this.createRefreshUrl('').then((url) => {
            return url;
        }, (err) => {});
    }

    run_flow: boolean = false;

    /**
     * Starts process to login and get OAuth tokens
     * @param  {string} additionalState OAuth State
     * @return {void}
     */
    initImplicitFlow(additionalState: string = "") {
        if(!this.clientId || this.clientId === '' || this.run_flow) return;
        this.createLoginUrl(additionalState).then((url) => {
            let here = location.href;
            this._storage.setItem('oauth_redirect', here);
            this.run_flow = true;
            if(sessionStorage) {
        		let logged = sessionStorage.getItem(`${this.clientId}_login`);
        		if(logged === 'true') {
                    if(window['debug']) console.debug('[COMPOSER][OAUTH] Logged in. Authorizing...');
	        		sessionStorage.removeItem(`${this.clientId}_login`);
        			location.href = url;
	        	} else {
                    if(window['debug']) console.debug('[COMPOSER][OAUTH] Not logged in redirecting to provider...');
	        		sessionStorage.setItem(`${this.clientId}_login`, 'true');
                    if(!this.loginRedirect || this.loginRedirect === '') {
                        this.loginRedirect === location.origin + '/auth/login'
                    }
                    let url = this.loginRedirect + '?continue=' + here;
                    if(window['debug']) console.debug(`[COMPOSER][OAUTH] Login: ${url}`);
	        		location.href = url;
	        	}
        	} else location.href = url;
        }, (err) => {});
    };

    callEventIfExists(options: any) {
        let that = this;
        if (options.onTokenReceived) {
            let tokenParams = {
                idClaims: that.getIdentityClaims(),
                idToken: that.getIdToken(),
                accessToken: that.getAccessToken(),
                state: that.state
            };
            options.onTokenReceived(tokenParams);
        }
    }
    /**
     * Try to process login
     * @param  {any}    options Login processing options
     * @return {Promise<boolean>} Returns Promise which resolves success of login
     */
    tryLogin(options?: any) {
        return new Promise((resolve, reject) => {
            this.attemptLogin(options, resolve, reject);
        })
    };
    /**
     * Attempts to process login information
     * @param  {any}    options Login processing options
     * @param  {any}    resolve Promise resolve
     * @param  {any}    reject  Promise reject
     * @return {void}
     */
    attemptLogin(options: any, resolve: any, reject: any) {
        if(this.clientId && this.clientId !== '') {
            options = options || { };


            let parts = this.getFragment();

            let accessToken = parts["access_token"];
            let idToken = parts["id_token"];
            let state = parts["state"];
            let code = parts['code'];
            let refreshToken = parts['refreshToken'];
            if(window['debug']) console.debug(`[COMPOSER][OAUTH] State: ${state}`);
            if(window['debug']) console.debug(`[COMPOSER][OAUTH] Access: ${accessToken} | Refresh: ${accessToken}`);

            let oidcSuccess = false;
            let oauthSuccess = false;

            if ( (!accessToken && !code && !refreshToken)  || !state ) {
                return resolve(false);
            }
            if (this.oidc && !idToken) {
                return resolve(false);
            }

            if(code) this.code = code;
            if(refreshToken) this._storage.setItem(`${this.clientId}_refresh_token`, refreshToken);

            let savedNonce = this._storage.getItem(`${this.clientId}_nonce`);

            let stateParts = state.split(';');
            let nonceInState = stateParts[0];
            if (savedNonce === nonceInState) {
                if(accessToken) this._storage.setItem(`${this.clientId}_access_token`, accessToken);

                let expiresIn = parts["expires_in"];

                if (expiresIn) {
                    let expiresInMilliSeconds = parseInt(expiresIn) * 1000;
                    let now = new Date();
                    let expiresAt = now.getTime() + expiresInMilliSeconds;
                    this._storage.setItem(`${this.clientId}_expires_at`, "" + expiresAt);
                }
                if (stateParts.length > 1) {
                    this.state = stateParts[1];
                }

                oauthSuccess = true;

            }

            if (!oauthSuccess) return resolve(false);

            if (!this.oidc && options.onTokenReceived) {
                options.onTokenReceived({ accessToken: accessToken});
            }

            if (this.oidc) {
                oidcSuccess = this.processIdToken(idToken, accessToken);
                if (!oidcSuccess) return resolve(false);
            }



            if (options.validationHandler) {

                let validationParams = {accessToken: accessToken, idToken: idToken};

                options
                    .validationHandler(validationParams)
                    .then(() => {
                        this.callEventIfExists(options);
                    })
                    .catch(function(reason: any) {
                        console.error('Error validating tokens');
                        console.error(reason);
                    })
            }
            else {
                this.callEventIfExists(options);
            }

            // NEXT VERSION: Notify parent-window (iframe-refresh)
            /*
            let win = window;
            if (win.parent && win.parent.onOAuthCallback) {
                win.parent.onOAuthCallback(this.state);
            }
            */
            this.removeHash();
            return resolve(true);
        } else {
            setTimeout(() => {
                this.attemptLogin(options, resolve, reject);
            }, 200);
        }
    }

    /**
     * Removes OAuth details from the URL Hash
     * @return {void}
     */
    removeHash() {
        let scrollV: any, scrollH: any, loc = window.location;
        if ("pushState" in history) {
            history.pushState("", document.title, loc.pathname + loc.search);
        } else {
            // Prevent scrolling by storing the page's current scroll offset
            scrollV = document.body.scrollTop;
            scrollH = document.body.scrollLeft;

            loc.hash = "";

            // Restore the scroll offset, should be flicker free
            document.body.scrollTop = scrollV;
            document.body.scrollLeft = scrollH;
        }
    }
    /**
     * Process tokens
     * @param  {any}    idToken     ID Token
     * @param  {any}    accessToken Access Token
     * @return {boolean} Returns success of processing id token
     */
    processIdToken(idToken: any, accessToken: any) {
            let tokenParts = idToken.split(".");
            let claimsBase64 = this.padBase64(tokenParts[1]);
            let claimsJson = Base64.decode(claimsBase64);
            let claims = JSON.parse(claimsJson);
            let savedNonce = this._storage.getItem(`${this.clientId}_nonce`);

            if (claims.aud !== this.clientId) {
                console.warn("Wrong audience: " + claims.aud);
                return false;
            }

            if (this.issuer && claims.iss !== this.issuer) {
                console.warn("Wrong issuer: " + claims.iss);
                return false;
            }

            if (claims.nonce !== savedNonce) {
                console.warn("Wrong nonce: " + claims.nonce);
                return false;
            }

            if (accessToken && !this.checkAtHash(accessToken, claims)) {
                console.warn("Wrong at_hash");
                return false;
            }

            // Das Prüfen des Zertifikates wird der Serverseite überlassen!

            let now = Date.now();
            let issuedAtMSec = claims.iat * 1000;
            let expiresAtMSec = claims.exp * 1000;

            let tenMinutesInMsec = 1000 * 60 * 10;

            if (issuedAtMSec - tenMinutesInMsec >= now  || expiresAtMSec + tenMinutesInMsec <= now) {
                console.warn("Token has been expired");
                console.warn({
                    now: now,
                    issuedAtMSec: issuedAtMSec,
                    expiresAtMSec: expiresAtMSec
                });
                return false;
            }

            this._storage.setItem(`${this.clientId}_id_token`, idToken);
            this._storage.setItem(`${this.clientId}_id_token_claims_obj`, claimsJson);
            this._storage.setItem(`${this.clientId}_id_token_expires_at`, "" + expiresAtMSec);

            if (this.validationHandler) {
                this.validationHandler(idToken)
            }

            return true;
    }

    /**
     * Get the identity claims from storage
     * @return {string} Returns the identity claims
     */
    getIdentityClaims() {
        let claims = this._storage.getItem(`${this.clientId}_id_token_claims_obj`);
        if (!claims) return null;
        return JSON.parse(claims);
    }
    /**
     * Get the id token from storage
     * @return {string} Returns the id token
     */
    getIdToken() {
        return this._storage.getItem(`${this.clientId}_id_token`);
    }

    padBase64(base64data: any) {
        while (base64data.length % 4 !== 0) {
            base64data += "=";
        }
        return base64data;
    }

    tryLoginWithIFrame() {
        throw new Error("tryLoginWithIFrame has not been implemented so far");
    };

    tryRefresh(timeoutInMsec: any) {
        throw new Error("tryRefresh has not been implemented so far");
    };
    /**
     * Get the access token from storage
     * @return {string} Returns the access token
     */
    getAccessToken() {
        let token = this._storage.getItem(`${this.clientId}_access_token`);
        if(!token) token = this._storage.getItem(`accessToken`)
        return token;
    };
    /**
     * Checks to see if access token is still valid
     * @return {boolean} Returns the expiry state of the access token
     */
    hasValidAccessToken() {
        if (this.getAccessToken()) {

            let expiresAt = this._storage.getItem(`${this.clientId}_expires_at`);
            if(!expiresAt) expiresAt = this._storage.getItem(`accessExpiry`);
            let now = new Date();
            if (expiresAt && parseInt(expiresAt) < now.getTime()) {
                return false;
            }

            return true;
        }

        return false;
    };

    hasValidIdToken() {
        if (this.getIdToken) {

            let expiresAt = this._storage.getItem(`${this.clientId}_id_token_expires_at`);
            let now = new Date();
            if (expiresAt && parseInt(expiresAt) < now.getTime()) {
                return false;
            }

            return true;
        }

        return false;
    };

    /**
     * Get the authorisation header to add to requests
     * @return {string} Returns authorisation header
     */
    authorizationHeader() {
        return "Bearer " + this.getAccessToken();
    }

    /**
     * Clears storage and redirects to logout URL
     * @return {void}
     */
    logOut() {
        if(window['debug']) console.debug('[COMPOSER][OAUTH] Logging out. Clear access tokens...')
        let id_token = this.getIdToken();
        let items = ['access_token', 'refresh_token', 'accesstoken', 'refreshtoken', 'id_token', 'idtoken', 'nonce', 'expires', 'login', 'oauth'];
        for (let i = 0; i < this._storage.length; i++){
            let key = this._storage.key(i);
            let lkey = key.toLowerCase();
            for(let k = 0; k < items.length; k++){
                if(lkey.indexOf(items[k]) >= 0){
                    this._storage.removeItem(key);
                    i--;
                    break;
                }
            }
        }

        if (!this.logoutUrl) {
            setTimeout(() => {
                this.location.replaceState(this.location.path(), '');
            }, 100);
            return;
        }

        let logoutUrl = this.logoutUrl.replace(/\{\{id_token\}\}/, id_token);
        if(window['debug']) console.debug('[COMPOSER][OAUTH] Redirecting to logout URL...')
        location.href = logoutUrl;
    };
    /**
     * Creates a nonce and stores it in storage
     * @return {string} Returns the created nonce
     */
    createAndSaveNonce() {
        return this.createNonce().then((nonce: any) => {
            this._storage.setItem(`${this.clientId}_nonce`, nonce);
            return nonce;
        }, (err) => {});

    };

    /**
     * Generates a nonce
     * @return {Promise<string>} Returns a promise that resolve a nonce
     */
    createNonce() {

        return new Promise((resolve, reject) => {

            if (this.rngUrl) {
                throw new Error("createNonce with rng-web-api has not been implemented so far");
            }
            else {
                let text = "";
                let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                for (let i = 0; i < 40; i++)
                    text += possible.charAt(Math.floor(Math.random() * possible.length));

                resolve(text);
            }

        });
    };
    /**
     * Breaks up URL hash/query into a key, value map
     * @return {any} Returns a map of key, value pairs from the URL hash/query
     */
    getFragment() {
        if (window.location.hash.indexOf("#") === 0) {
            return this.parseQueryString(window.location.hash.substr(1));
        } else if (window.location.search.indexOf("?") === 0) {
            return this.parseQueryString(window.location.search.substr(1));
        } else {
            return {};
        }
    };

    /**
     * Parses query string and generates a map of the parameters
     * @param  {string}    queryString Query or hash string
     * @return {any} Returns a map of key, value pairs from the query string
     */
    parseQueryString(queryString: string) {
        let data = {}, pairs: any, pair: any, separatorIndex: any, escapedKey: any, escapedValue: any, key: any, value: any;

        if (queryString === null) {
            return data;
        }

        pairs = queryString.split("&");

        for (let i = 0; i < pairs.length; i++) {
            pair = pairs[i];
            separatorIndex = pair.indexOf("=");

            if (separatorIndex === -1) {
                escapedKey = pair;
                escapedValue = null;
            } else {
                escapedKey = pair.substr(0, separatorIndex);
                escapedValue = pair.substr(separatorIndex + 1);
            }

            key = decodeURIComponent(escapedKey);
            value = decodeURIComponent(escapedValue);

            if (key.substr(0, 1) === '/')
                key = key.substr(1);

            data[key] = value;
        }

        return data;
    };

    /**
     * Checks if claims and tokens correctly in hash
     * @param  {any}    accessToken Access Token
     * @param  {any}    idClaims    ID Claims
     * @return {boolean} Returns claims and tokens correctly in hash
     */
    checkAtHash(accessToken: any, idClaims: any) {
        if (!accessToken || !idClaims || !idClaims.at_hash ) return true;
        let tokenHash: Array<any> = toByteArrayFunc(sha256.hash(accessToken));
        let leftMostHalf = tokenHash.slice(0, (tokenHash.length/2) );
        let tokenHashBase64 = fromByteArrayFunc(leftMostHalf);
        let atHash = tokenHashBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
        let claimsAtHash = idClaims.at_hash.replace(/=/g, "");

        if (atHash != claimsAtHash) {
            console.warn("exptected at_hash: " + atHash);
            console.warn("actual at_hash: " + claimsAtHash);
        }


        return (atHash == claimsAtHash);
    }

}
