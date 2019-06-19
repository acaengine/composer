/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-01 15:15:55
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-02 11:13:34
 */

import { Observable } from 'rxjs';

import { MOCK_REQ_HANDLER } from './request-handler.mock';

export interface IMockResponseEvent {
    url?: string;
    method?: string;
    data: any;
    params: { [name: string]: any };
    fragments: { [name: string]: any };
}

export class MockRequest {
    private resp_fn: (r: IMockResponseEvent) => void = null;
    private response: any = null;
    private fragments: { [name: string]: any } = {};

    constructor(private method: string, private url: string, private data: any, private options: { [name: string]: any }) {
        this.getFragments(url);
        // Remove origin from URL
        if (url.indexOf('http') === 0) {
            url = '/' + url.split('/').slice(3).join('/');
        }
        this.getFragments(url);
    }

    public map(fn: (response: IMockResponseEvent) => void) {
        this.resp_fn = fn;
        return this;
    }

    public subscribe(data: (value: {}) => void, error: (error: {}) => void, complete: () => void): any {
        return new Observable((observer) => {
            setTimeout(() => {
                const res = MOCK_REQ_HANDLER.response(this.method, this.url, this.fragments, this.data);
                if (!res || res.status === 400 || res.status === 404) {
                    observer.error(res);
                } else {
                    observer.next(res);
                }
                setTimeout(() => observer.complete(), 200);
            }, 200);
        }).subscribe(data, error, complete);
    }

    private getFragments(url: string) {
        const url_parts = url.split('?');
        this.url = url_parts[0];
        const frag = url_parts.length > 1 ? url_parts[1] : null;
        const parts: any = {};
        if (frag) {
            const params = frag.split('&');
            if (params.length > 0) {
                for (const item of params) {
                    const pair = item.split('=');
                    if (pair.length === 2) {
                        parts[pair[0]] = pair[1];
                    }
                }
            }
        }
        this.fragments = parts;
    }

}
