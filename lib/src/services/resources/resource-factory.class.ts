/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-02 10:36:28
 * @Last Modified by: Alex Sorafumo
 * @Last Modified time: 2017-12-15 10:24:28
 */

import { Observable } from 'rxjs';

import { COMPOSER } from '../../settings';
import { CommsService } from '../auth/comms.service';
import { COMMON } from './common';
import { Resource } from './resource.class';
import { ResourcesService } from './resources.service';

export class ResourceFactory {
    public params: any;         // API URL Parameters
    public service: ResourcesService;  // Parent service
    public methods: any;        // Methods available to Factory
    private url: string;        // Factory Resource API URL
    private promise: any = {};  //

    constructor(url: string, route_params: any, methods: any, private http: CommsService) {
        this.url = url;
        this.methods = methods;
        this.params = route_params;
        const keys = Object.keys(methods);
        for (const key of keys) {
            let func: any;
            switch (this.methods[key].method) {
                case COMMON.cmd.GET:
                    func = (ikey: any) => {
                        this[ikey] = (params: any) => this._get(this.methods[ikey], params);
                    };
                    func(key);
                    break;
                case COMMON.cmd.POST:
                    func = (ikey: any) => {
                        this[ikey] = (params: any, data: any) => this._post(this.methods[ikey], params, data);
                    };
                    func(key);
                    break;
                case COMMON.cmd.PUT:
                    func = (ikey: any) => {
                        this[ikey] = (params: any, data: any) => this._put(this.methods[ikey], params, data);
                    };
                    func(key);
                    break;
                case COMMON.cmd.DELETE:
                    func = (ikey: any) => {
                        this[ikey] = (params: any) => this._delete(this.methods[ikey], params);
                    };
                    func(key);
                    break;
            }
        }
    }

    public get_authority() { return new Promise<{ [name: string]: string}>((resolve) => resolve({})); }

    public get(params: { [name: string]: any }) { return this._get({ method: 'GET' }, params) }
    public post(params: { [name: string]: any }, data: any) { return this._get({ method: 'POST' }, params, data) }
    public put(params: { [name: string]: any }, data: any) { return this._get({ method: 'PUT' }, params, data) }
    public delete(params: { [name: string]: any }) { return this._get({ method: 'DELETE' }, params) }

    /**
     * Builds a url to use by the factory
     * @param params Parameters to be injected into the url
     * @param url    (Optional) URL for the parameters to be injected into, defaults to factory URL
     * @return URL with the params injected into the appropriate places
     */
    private createUrl(params: any, url?: any) {
        const gkeys = Object.keys(this.params);
        if (params === undefined || params === null) {
            params = {};
        }
        const keys = Object.keys(params);
        let outUrl = url ? url : this.url;
        // Add url parameters
        for (const key of gkeys) {
            if (this.params[key].indexOf('@') === 0) { // User defined parameter
                const value = (params[this.params[key].substr(1)] ? '/' + params[this.params[key].substr(1)] : '');
                outUrl = outUrl.replace('/:' + key, value);
            } else { // Developer defined parameter
                const value = this.params[key] ? '/' + this.params[key] : '';
                outUrl = outUrl.replace('/:' + key, value);
            }
        }
        // Add query parameters
        let first = true;
        let query = '?';
        for (const key of keys) {
            if (gkeys.indexOf(key) < 0) {
                if (!first) {
                    query += '&';
                }
                if (key && params[key]) {
                    query += key + '=' + params[key];
                    first = false;
                }
            }
        }
        if (query.length > 1) {
            outUrl += query;
        }
        return outUrl;
    }

    /**
     * Create a new resource object with the provided data
     * @param data    Resource data
     * @param url     URL that the resource was retrieved from
     * @param isArray Does the data contain multiple resources
     * @return Resources from the parsed data
     */
    private processData(data: any, url: string, isArray?: boolean) {
        let result: any;
        if (isArray === true) {
            result = [];
            for (const item of data) {
                result.push(new Resource(this, item, url));
            }
        } else {
            result = new Resource(this, data, url);
        }
        return result;
    }

    /**
     * Wrapper for a GET request
     * @param method Object describing the handling of the method
     * @param params URL parameters(Route/Query)
     * @return Promise of the result of the http GET
     */
    private _get(method: any, params: any, tries: number = 0) {
        return this.sendAction(method, params)
    }

    /**
     * Wrapper for a DELETE request
     * @param method Object describing the handling of the method
     * @param params URL parameters(Route/Query)
     * @return Promise of the result of the http DELETE
     */
    private _delete(method: any, params: any, tries: number = 0) {
        return this.sendAction(method, params, tries);
    }


    private sendAction(method: any, params: any, tries: number = 0) {
        const url = this.createUrl(params);
        const type = method.method.toLowerCase();
        const key = `${type}|${url}`;
        if (!this.promise[key]) {
            this.promise[key] = new Promise<any>((resolve, reject) => {
                if (!this.service || !this.service.authLoaded) {
                    return setTimeout(() => {
                        this.promise[key] = null;
                        this.sendAction(method, params).then(d => resolve(d), e => reject(e));
                    }, 300);
                }
                if (tries > 3) {  return reject({ status: 503, message: 'Authentication is not ready' }); }
                this.service.is_ready.then((ready: boolean) => {
                    if (!ready) {
                        return setTimeout(() => {
                            this.promise[key] = null;
                            this.sendAction(method, params).then(d => resolve(d), e => reject(e));
                        }, 300 * ++tries);
                    }
                    let result: any;
                    this.http[type](url, method)
                        .subscribe(
                        (d) => result = this.processData(d, url, method.isArray),
                        (e) => {
                            this.promise[key] = null;
                            reject(e);
                        }, () => {
                            this.promise[key] = null;
                            resolve(result);
                        }
                    );
                });
            });
        }
        return this.promise[key];
    }

    /**
     * Wrapper for a POST request
     * @param method Object describing the handling of the method
     * @param params URL parameters(Route/Query)
     * @param data   POST data
     * @return Promise of the result of the http POST
     */
    private _post(method: any, params: any, data: any, tries: number = 0) {
        return this.sendData(method, params, data, tries);
    }

    /**
     * Wrapper for a PUT request
     * @param method Object describing the handling of the method
     * @param params URL parameters(Route/Query)
     * @param data   PUT data
     * @return Promise of the result of the http PUT
     */
    private _put(method: any, params: any, data: any, tries: number = null) {
        return this.sendData(method, params, data, tries);
    }

    private sendData(method, params, data, tries: number = 0) {
        const url = this.createUrl(params);
        const type = method.method.toLowerCase();
        return new Promise<any>((resolve, reject) => {
            if (!this.service || !this.service.authLoaded) {
                return setTimeout(() => this.sendData(method, params, data).then(d => resolve(d), e => reject(e)), 300);
            }
            if (tries > 3) {  return reject({ status: 503, message: 'Authentication is not ready' }); }
            this.service.is_ready.then((ready: boolean) => {
                if (!ready) {
                    return setTimeout(() => this.sendData(method, params, data).then(d => resolve(d), e => reject(e)), 300 * ++tries);
                }
                let result: any;
                this.http[type](url, method, data)
                    .subscribe(
                    (d) => result = this.processData(d, url, method.isArray),
                    (e) => reject(e),
                    () => resolve(result)
                );
            });
        });
    }

    /**
     * Check if user is authorised
     * @return  Auth state of the user
     */
    private auth() {
        return this.http.isLoggedIn();
    }

}
