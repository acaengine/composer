/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-01 15:16:12
 * @Last Modified by: Alex Sorafumo
 * @Last Modified time: 2017-07-24 12:46:11
 */

import { COMPOSER } from '../../../settings';

export class MockRequestHandler {
    private handlers: any = {};

    public register(url: string, data: any, fn?: (handler) => any) {
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

    public response(method: string, url: string, fragment?: any) {
        const handler: any = this.getHandler(url);
        if (method === 'GET') {
            if (handler) {
                let resp: any = null;
                if (handler.fn) {
                    const h = {
                        data: handler.data,
                        fragment,
                        params: handler.params,
                    };
                    resp = handler.fn(h);
                } else {
                    resp = handler.data;
                }
                COMPOSER.log(`HTTP(M)`, `Response to ${method} for url "${url}"`, resp);
                return resp;
            } else {
                const error = {
                    status: 404,
                    code: 404,
                    message: 'Requested resource was not found.',
                    data: {},
                };
                COMPOSER.log(`HTTP(M)`, `Response to ${method} for url "${url}"`, error);
                return error;
            }
        } else {
            COMPOSER.log(`HTTP(M)`, `Response to ${method} for url "${url}"`, 'Success');
            return {
                message: 'Ok',
                data: {},
            };
        }
    }

    private getHandler(url: string) {
        // Remove origin from URL
        if (url.indexOf('http') === 0) {
            url = url.split('/').slice(3).join('/');
        }
            // Check if there is exact match for the URL.
        if (this.handlers[url]) {
            return this.handlers[url];
        }
        console.log(this.handlers);
        const parts = url.split('/');
            // Search for match in handlers with URL parameters.
        for (const h in this.handlers) {
            if (this.handlers.hasOwnProperty(h) &&
                this.handlers[h].route_params &&
                this.handlers[h].route_params.length > 0) {
                const handler = this.handlers[h];
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
