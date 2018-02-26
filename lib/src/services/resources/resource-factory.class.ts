/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-02 10:36:28
 * @Last Modified by: Alex Sorafumo
 * @Last Modified time: 2017-12-15 10:24:28
 */

import { Observable } from 'rxjs/Observable';

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
    /**
     * Builds a url to use by the factory
     * @param params Parameters to be injected into the url
     * @param url    (Optional) URL for the parameters to be injected into, defaults to factory URL
     * @return         Returns a URL with the params injected into the appropriate places
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
     * Creates a new resource object with the provided data
     * @param data    Resource data
     * @param url     URL that the resource was retrieved from
     * @param isArray Does the data contain multiple resources
     * @return   Returns the resources from the parsed data
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
     * @return   Returns a promise which returns the result of the http GET
     */
    private _get(method: any, params: any) {
        const url = method.url ? this.createUrl(params, method.url) : this.createUrl(params);
        return new Promise<any>((resolve, reject) => this.__get(url, method, resolve, reject));
    }
    /**
     * Wrapper for a GET request
     * @param url     Request URL
     * @param method  Object describing the handling of the method
     * @param resolve Promise resolve function
     * @param reject  Promise reject function
     * @return
     */
    private __get(url: any, method: any, resolve: any, reject: any, tries: number = 0) {
        if (tries > 10) {
            return reject({ status: 401, message: 'No auth tokens loaded.' });
        }
        if (this.service.authLoaded) {
            this.service.is_ready.then((ready: boolean) => {
                if (ready) {
                    let result: any;
                    this.http.get(url, method)
                        .subscribe(
                        (data) => result = this.processData(data, url, method.isArray),
                        (err) => reject(err),
                        () => resolve(result),
                    );
                } else {
                    setTimeout(() => this.__get(url, method, resolve, reject, ++tries), 500);
                }
            });
        } else {
            setTimeout(() => this.__get(url, method, resolve, reject), 500);
        }
    }

    /**
     * Wrapper for a POST request
     * @param method Object describing the handling of the method
     * @param params URL parameters(Route/Query)
     * @param data   POST data
     * @return   Returns a promise which returns the result of the http GET
     */
    private _post(method: any, params: any, data: any) {
        const url = this.createUrl(params);
        return new Promise<any>((resolve, reject) => this.__post(url, method, data, resolve, reject));
    }

    /**
     * Wrapper for a POST request
     * @param url     Request URL
     * @param method  Object describing the handling of the method
     * @param data    POST data
     * @param resolve Promise resolve function
     * @param reject  Promise reject function
     * @return
     */
    private __post(url: any, method: any, req_data: any, resolve: any, reject: any, tries: number = 0) {
        if (tries > 10) {
            return reject({ status: 401, message: 'No auth tokens loaded.' });
        }
        if (this.service.authLoaded) {
            this.service.is_ready.then((ready: boolean) => {
                if (ready) {
                    let result: any;
                    this.http.post(url, req_data, method)
                        .subscribe(
                        (data) => result = this.processData(data, url, method.isArray),
                        (err) => reject(err),
                        () => resolve(result),
                    );
                } else {
                    setTimeout(() => this.__post(url, method, req_data, resolve, reject, ++tries), 500);
                }
            });
        } else {
            setTimeout(() => this.__post(url, req_data, method, resolve, reject), 500);
        }
    }

    /**
     * Wrapper for a PUT request
     * @param method Object describing the handling of the method
     * @param params URL parameters(Route/Query)
     * @param data   PUT data
     * @return   Returns a promise which returns the result of the http GET
     */
    private _put(method: any, params: any, data: any) {
        const url = this.createUrl(params);
        return new Promise<any>((resolve, reject) => this.__put(url, method, data, resolve, reject));
    }

    /**
     * Wrapper for a PUT request
     * @param url     Request URL
     * @param method  Object describing the handling of the method
     * @param data    PUT data
     * @param resolve Promise resolve function
     * @param reject  Promise reject function
     * @return
     */
    private __put(url: any, method: any, req_data: any, resolve: any, reject: any, tries: number = 0) {
        if (tries > 10) {
            return reject({ status: 401, message: 'No auth tokens loaded.' });
        }
        if (this.service.authLoaded) {
            this.service.is_ready.then((ready: boolean) => {
                if (ready) {
                    let result: any;
                    this.http.put(url, req_data, method)
                        .subscribe(
                        (data) => result = this.processData(data, url, method.isArray),
                        (err) => reject(err),
                        () => resolve(result),
                    );
                } else {
                    setTimeout(() => this.__put(url, method, req_data, resolve, reject, ++tries), 500);
                }
            });
        } else {
            setTimeout(() => this.__put(url, method, req_data, resolve, reject), 500);
        }
    }

    /**
     * Wrapper for a DELETE request
     * @param method Object describing the handling of the method
     * @param params URL parameters(Route/Query)
     * @return   Returns a promise which returns the result of the http GET
     */
    private _delete(method: any, params: any) {
        const url = this.createUrl(params);
        return new Promise((resolve, reject) => this.__delete(url, method, resolve, reject));
    }

    /**
     * Wrapper for a DELETE request
     * @param url     Request URL
     * @param method  Object describing the handling of the method
     * @param resolve Promise resolve function
     * @param reject  Promise reject function
     * @return
     */
    private __delete(url: any, method: any, resolve: any, reject: any, tries: number = 0) {
        if (tries > 10) {
            return reject({ status: 401, message: 'No auth tokens loaded.' });
        }
        if (this.service.authLoaded) {
            this.service.is_ready.then((ready: boolean) => {
                if (ready) {
                    let result: any;
                    this.http.delete(url, method)
                        .subscribe(
                        (data) => result = this.processData(data, url, method.isArray),
                        (err) => reject(err),
                        () => resolve(result),
                    );
                } else {
                    setTimeout(() => this.__delete(url, method, resolve, reject, ++tries), 500);
                }
            });
        } else {
            setTimeout(() => this.__delete(url, method, resolve, reject), 500);
        }
    }

    /**
     * Checks to see if user is authorised
     * @return  Returns whether or not the user is logged in
     */
    private auth() {
        return this.http.isLoggedIn();
    }

}
