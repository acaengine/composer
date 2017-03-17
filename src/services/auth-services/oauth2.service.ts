/**
* @Author: Alex Sorafumo
* @Date:   19/10/2016 10:47 AM
* @Email:  alex@yuion.net
* @Filename: oauth2.service.ts
* @Last modified by:   Alex Sorafumo
* @Last modified time: 06/02/2017 11:21 AM
*/

import { Injectable } from '@angular/core';
import { Location } from '@angular/common';

//*
import { Base64 } from './inc/js-base64';
import { fromByteArrayFunc, toByteArrayFunc } from './inc/base64-js';
import * as sha256 from "fast-sha256";
import { COMPOSER_SETTINGS } from '../../settings';
import { DataStoreService } from '../data-store.service';

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
    private debug: boolean = false;

    constructor(private location: Location, private store: DataStoreService) {
        COMPOSER_SETTINGS.observe('debug').subscribe((data: any) => {
        	this.debug = data;
        });
    }

    /**
     * Set the type of storage to use for OAuth
     * @param  {string} storage Storage to use Local or Session
     * @return {void}
     */
    public setStorage(storage: string) {
        this._storage = storage;
    }

    private _storage: string = 'local';
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
            return this.store[this._storage].getItem(`${this.clientId}_refresh_token`).then((refresh_token) => {
	            if(!refresh_token) {
	                return this.store[this._storage].getItem(`refreshToken`).then((refresh_token) => {
			            if(refresh_token){
			                return url += `&refresh_token=${encodeURIComponent(refresh_token)}&grant_type=${encodeURIComponent('refresh_token')}`;
			            } else {
			                return url += `&code=${encodeURIComponent(this.code)}&grant_type=${encodeURIComponent('authorization_code')}`;
			            }
	                });
	            } else {
			        return url += `&refresh_token=${encodeURIComponent(refresh_token)}&grant_type=${encodeURIComponent('refresh_token')}`;
	            }
	        });
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
        	let path = location.href;
            if(location.hash.indexOf(path) >= 0 && location.href.indexOf(location.origin + '/#/') >= 0) {
            	if(path.indexOf('?') >= 0) {
            		path = path.split('?')[0];
            	}
            }
            let here = path;
            this.store['local'].setItem(`oauth_redirect`, here);
            this.run_flow = true;
        	this.store.session.getItem(`${this.clientId}_login`).then((logged) => {
        		if(logged === 'true') {
                    if(this.debug) console.debug('[COMPOSER][OAUTH] Logged in. Authorizing...');
	        		this.store.session.removeItem(`${this.clientId}_login`);
        			location.href = url;
	        	} else {
                    if(this.debug) console.debug('[COMPOSER][OAUTH] Not logged in redirecting to provider...');
	        		this.store.session.setItem(`${this.clientId}_login`, 'true');
                    if(!this.loginRedirect || this.loginRedirect === '') {
                        this.loginRedirect === location.origin + '/auth/login'
                    }
                    let url = this.loginRedirect;//* + '?continue=' + here;*/
                    if(this.debug) console.debug(`[COMPOSER][OAUTH] Login: ${url}`);
	        		location.href = url;
	        	}
    		});
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
            if(Object.keys(parts).length <= 1) {
                this.store.session.getItem('OAUTH.params').then((item) => {
                    if(item) {
                        parts = JSON.parse(item);
                    }
                    this.store.session.removeItem('OAUTH.params');
                    this.processLogin(parts, options, resolve, reject);
                });
            } else {
            	this.processLogin(parts, options, resolve, reject);
            }
        } else {
            setTimeout(() => {
                this.attemptLogin(options, resolve, reject);
            }, 200);
        }
    }

    processLogin(parts: any, options: any, resolve: any, reject: any) {
    	console.log(parts);
        let accessToken = parts["access_token"];
        let idToken = parts["id_token"];
        let state = parts["state"];
        let code = parts['code'];
        let refreshToken = parts['refreshToken'];
        if(this.debug) console.debug(`[COMPOSER][OAUTH] State: ${state}`);
        if(this.debug) console.debug(`[COMPOSER][OAUTH] Access: ${accessToken} | Refresh: ${accessToken}`);

        let oidcSuccess = false;
        let oauthSuccess = false;

        if ( (!accessToken && !code && !refreshToken)  || !state ) {
            return resolve(false);
        }
        if (this.oidc && !idToken) {
            return resolve(false);
        }

        if(code) this.code = code;
        if(refreshToken) this.store[this._storage].setItem(`${this.clientId}_refresh_token`, refreshToken);

        this.store[this._storage].getItem(`${this.clientId}_nonce`).then((savedNonce) => {

	        let stateParts = state.split(';');
	        let nonceInState = stateParts[0];
	        if (savedNonce === nonceInState) {
	            if(accessToken) this.store[this._storage].setItem(`${this.clientId}_access_token`, accessToken);

	            let expiresIn = parts["expires_in"];

	            if (expiresIn) {
	                let expiresInMilliSeconds = parseInt(expiresIn) * 1000;
	                let now = new Date();
	                let expiresAt = now.getTime() + expiresInMilliSeconds;
	                this.store[this._storage].setItem(`${this.clientId}_expires_at`, "" + expiresAt);
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
	            this.processIdToken(idToken, accessToken).then((oidcSuccess) => {
	           		if (!oidcSuccess) return resolve(false);
	            });
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
	       		// Clean up after token has been received
	       	this.store[this._storage].removeItem('oauth_redirect');
	       	this.store[this._storage].setItem('oauth_finished', 'true');
	        return resolve(true);
        });

    }
    /**
     * Process tokens
     * @param  {any}    idToken     ID Token
     * @param  {any}    accessToken Access Token
     * @return {boolean} Returns success of processing id token
     */
    processIdToken(idToken: any, accessToken: any) {
    	return new Promise((resolve) => {
            let tokenParts = idToken.split(".");
            let claimsBase64 = this.padBase64(tokenParts[1]);
            let claimsJson = Base64.decode(claimsBase64);
            let claims = JSON.parse(claimsJson);
            this.store[this._storage].getItem(`${this.clientId}_nonce`).then((savedNonce) => {

	            if (claims.aud !== this.clientId) {
	                console.warn("Wrong audience: " + claims.aud);
	                return resolve(false);
	            }

	            if (this.issuer && claims.iss !== this.issuer) {
	                console.warn("Wrong issuer: " + claims.iss);
	                return resolve(false);
	            }

	            if (claims.nonce !== savedNonce) {
	                console.warn("Wrong nonce: " + claims.nonce);
	                return resolve(false);
	            }

	            if (accessToken && !this.checkAtHash(accessToken, claims)) {
	                console.warn("Wrong at_hash");
	                return resolve(false);
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
	                return resolve(false);
	            }

	            this.store[this._storage].setItem(`${this.clientId}_id_token`, idToken);
	            this.store[this._storage].setItem(`${this.clientId}_id_token_claims_obj`, claimsJson);
	            this.store[this._storage].setItem(`${this.clientId}_id_token_expires_at`, "" + expiresAtMSec);

	            if (this.validationHandler) {
	                this.validationHandler(idToken)
	            }
	            return resolve(true);
            });
        });
    }

    /**
     * Get the identity claims from storage
     * @return {string} Returns the identity claims
     */
    getIdentityClaims() {
        let claims = this.store[this._storage].getItem(`${this.clientId}_id_token_claims_obj`).then((res) => {return res;});
        if (!claims) return null;
        return JSON.parse(claims);
    }
    /**
     * Get the id token from storage
     * @return {string} Returns the id token
     */
    getIdToken() {
        return this.store[this._storage].getItem(`${this.clientId}_id_token`).then((res) => { return res; });
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
    access_token_promise: any = null;
    getAccessToken() {
    	if(!this.access_token_promise) {
    		this.access_token_promise = new Promise((resolve) => {
    			this.store[this._storage].getItem(`${this.clientId}_access_token`).then((token) => {
    				if(!token) {
	    				this.store[this._storage].getItem(`accessToken`).then((token) => {
	    					resolve(token);
	    				});
    				} else {
    					resolve(token);
    				}
    			});
    		});
    	}
        return this.access_token_promise;
    };
    /**
     * Get the access token from storage
     * @return {string} Returns the access token
     */
    refresh_token_promise: any = null;
    getRefreshToken() {
    	if(!this.refresh_token_promise) {
    		this.refresh_token_promise = new Promise((resolve) => {
    			this.store[this._storage].getItem(`${this.clientId}_refresh_token`).then((token) => {
    				if(!token) {
	    				this.store[this._storage].getItem(`refreshToken`).then((token) => {
	    					resolve(token);
	    				});
    				} else {
    					resolve(token);
    				}
    			});
    		});
    	}
        return this.refresh_token_promise;
    };
    /**
     * Checks to see if access token is still valid
     * @return {boolean} Returns the expiry state of the access token
     */
    valid_access_token_promise: any = null;
    hasValidAccessToken() {
    	if(!this.valid_access_token_promise) {
    		this.valid_access_token_promise = new Promise((resolve, reject) => {
    			this.getAccessToken().then((token) => {
		            this.store[this._storage].getItem(`${this.clientId}_expires_at`).then((expiresAt) => {
		            	if(!expiresAt) {
		            		this.store[this._storage].getItem(`accessExpiry`).then((expiresAt) => {
					            let now = new Date();
					            if (!expiresAt || parseInt(expiresAt) < now.getTime()) {
					                return resolve(false);
					            }
					            return resolve(true);
		            		});
		            	} else {
				            let now = new Date();
				            if (expiresAt && parseInt(expiresAt) < now.getTime()) {
				                return resolve(false);
				            }
				            return resolve(true);
		            	}
		            });
    			});
	    	});
    	}
    	return this.valid_access_token_promise;
    };

    valid_id_token_promise: any = null;
    hasValidIdToken() {
    	if(!this.valid_id_token_promise) {
    		this.valid_id_token_promise = new Promise((resolve, reject) => {
		        if (this.getIdToken) {
		            this.store[this._storage].getItem(`${this.clientId}_id_token_expires_at`).then((expiresAt) => {
			            let now = new Date();
			            if (expiresAt && parseInt(expiresAt) < now.getTime()) {
			                return resolve(false);
			            } else {
							return resolve(true);
			            }
		            });
		        } else {
		        	resolve(false);
		        }
    		})
    	}
    };

    /**
     * Get the authorisation header to add to requests
     * @return {string} Returns authorisation header
     */
    auth_header_promise: any = null;
    authorizationHeader() {
    	if(!this.auth_header_promise) {
    		this.auth_header_promise = new Promise<any>((resolve) => {
    			this.getAccessToken().then((token) => {
    				resolve(`Bearer ${token}`);
    				setTimeout(() => {
    					this.auth_header_promise = null;
    				}, 1000);
    			});
    		});
    	}
        return this.auth_header_promise;
    }

    /**
     * Clears storage and redirects to logout URL
     * @return {void}
     */
    logOut() {
        if(this.debug) console.debug('[COMPOSER][OAUTH] Logging out. Clear access tokens...')
        let id_token = this.getIdToken();
        this.clearAuth();
        if (!this.logoutUrl) {
            setTimeout(() => {
                this.location.replaceState(this.location.path(), '');
            }, 100);
            return;
        }

        let logoutUrl = this.logoutUrl.replace(/\{\{id_token\}\}/, id_token);
        if(this.debug) console.debug('[COMPOSER][OAUTH] Redirecting to logout URL...')
        location.href = logoutUrl;
    };
    /**
     * Removes any auth related details from storage
     * @return {void}
     */
    clearAuth() {
        let items = ['access_token', 'refresh_token', 'accesstoken', 'refreshtoken', 'id_token', 'idtoken', 'nonce', 'expires', 'login', 'oauth'];
        let keys = this.store[this._storage].keys();
        for (let i = 0; i < keys.length; i++){
            let lkey = keys[i].toLowerCase();
            for(let k = 0; k < items.length; k++){
                if(lkey.indexOf(items[k]) >= 0){
                    this.store[this._storage].removeItem(keys[i]);
                    i--;
                    break;
                }
            }
        }
    }
    /**
     * Creates a nonce and stores it in storage
     * @return {string} Returns the created nonce
     */
    createAndSaveNonce() {
        return this.createNonce().then((nonce: any) => {
            this.store[this._storage].setItem(`${this.clientId}_nonce`, nonce);
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
    	let path = this.location.path();
        if (location.hash.indexOf("#") === 0 && location.hash.indexOf(path) < 0) {
            return this.parseQueryString(location.hash.substr(1));
        } else if (location.search.indexOf("?") === 0) {
            return this.parseQueryString(location.search.substr(1));
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
