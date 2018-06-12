/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-01 15:16:12
 * @Last Modified by: Alex Sorafumo
 * @Last Modified time: 2017-07-24 12:46:11
 */

import { COMPOSER } from '../../../settings';

export class MockRequestHandler {
    private handlers: any = {};

    /**
     * Register a mock resource
     * @param url URL of the resource
     * @param data Data of the resource
     * @param fn Callback to handle requests to the resource
     */
    public register(url: string, data: any, fn?: (handler: any) => any) {
        const parts = url.split('/');
        const params: string[] = [];
        for (const i of parts) {
            if (i[0] === ':') {
                params.push(i);
            }
        }
        this.handlers[url] = {
            data,
            parts,
            route_params: params,
            params: {},
            fn,
        };
        COMPOSER.log(`HTTP(M)`, `Registered handler for url "${url}"`);
    }

    /**
     * Unregister a mock resource
     * @param url URL of resource
     */
    public unregister(url: string) {
        if (this.handlers[url]) {
            this.handlers[url] = null;
            delete this.handlers[url];
            COMPOSER.log(`HTTP(M)`, `Unregistered handler for url "${url}"`);
        }
    }

    /**
     * Respond to a resource request
     * @param method Request method. GET, POST, PUT, DELETE etc.
     * @param url URL of the request
     * @param fragment Parsed URL fragments
     */
    public response(method: string, url: string, fragment?: any) {
        const handler: any = this.getHandler(url);
        if (method === 'GET') {
            if (handler) {
                let resp: any = null;
                if (handler.fn) {
                    const h = {
                        data: handler.data,
                        fragment,
                        params: handler.params
                    };
                    resp = handler.fn(h);
                } else {
                    resp = handler.data;
                }
                COMPOSER.log(`HTTP(M)`, `Response to ${method} for url "${url}"`, resp);
                if (!resp) {
                    resp = this.not_found;
                }
                return resp;
            } else {
                COMPOSER.log(`HTTP(M)`, `Response to ${method} for url "${url}"`, this.not_found);
                return this.not_found;
            }
        } else {
            COMPOSER.log(`HTTP(M)`, `Response to ${method} for url "${url}"`, 'Success');
            return { message: 'Ok', data: {} };
        }
    }

    private get not_found() {
        return {
            status: 404,
            code: 404,
            message: 'Requested resource was not found.',
            data: {},
        };
    }
    /**
     * Process handler for URL
     * @param url URL to generate handler for
     */
    private getHandler(url: string) {
        // Remove origin from URL
        if (url.indexOf('http') === 0) {
            url = url.split('/').slice(3).join('/');
        }
            // Check if there is exact match for the URL.
        if (this.handlers[url]) {
            return this.handlers[url];
        }
        const parts = url.split('/');
            // Search for match in handlers with URL parameters.
        for (const h in this.handlers) {
            if (this.handlers.hasOwnProperty(h) &&
                this.handlers[h].route_params &&
                this.handlers[h].route_params.length > 0) {
                const handler: any = this.handlers[h];
                let count = 0;
                for (let i = 0; i < handler.parts.length; i++) {
                    const p = handler.parts[i];
                    if (p === parts[i]) {
                        count++;
                    } else if (p.indexOf(':') === 0) {
                        handler.params[p.split(':')[1]] = parts[i];
                        count++;
                    }
                }
                if (handler.parts.length === count) {
                    return handler;
                }
            }
        }
        return null;
    }
}

export let MOCK_REQ_HANDLER = new MockRequestHandler();
