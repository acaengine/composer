/*
* @Author: Alex Sorafumo
* @Date:   2017-05-01 15:16:12
* @Last Modified by:   Alex Sorafumo
* @Last Modified time: 2017-05-01 15:55:47
*/

import { COMPOSER } from '../../../settings';

export class MockRequestHandler {
    private handlers: any = {};

    public register(url: string, data: any, fn?: (frag: any, data: any) => any) {
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
            fn,
        };
        COMPOSER.log(`HTTP(M)`, `Registered handler for url "${url}"`);
    }

    public response(method: string, url: string, fragment?: any) {
        const error = {
            status: 404,
            code: 404,
            message: 'Requested resource was not found.',
            data: {},
        };
        if (method === 'GET') {
            if (this.handlers[url]) {
                const resp = this.handlers[url].fn ? this.handlers[url].fn(fragment, this.handlers[url].data) : this.handlers[url].data;
                COMPOSER.log(`HTTP(M)`, `Response to ${method} for url "${url}"`, resp);
                return resp;
            } else {
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
}

export let MOCK_REQ_HANDLER = new MockRequestHandler();
