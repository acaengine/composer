/*
* @Author: Alex Sorafumo
* @Date:   2017-03-21 16:57:15
* @Last Modified by:   Alex Sorafumo
* @Last Modified time: 2017-03-28 10:07:27
*/

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { COMPOSER_SETTINGS } from '../../settings';
import { initialiseMockClasses } from './mock.classes';

export class MockRequestHandler {
	private handlers: any = {};
	constructor() {
	}

	register(url: string, is_array: boolean, data: any) {
		let parts = url.split('/');
		let params: string[] = [];
		for(let i = 0; i < parts.length; i++) {
			if(parts[i][0] === ':') {
				params.push(parts[i]);
			}
		} 
		this.handlers[url] = {
			data: data,
			parts: parts,
			route_params: params,
			is_array: is_array
		};
		//if(COMPOSER_SETTINGS.get('debug')) console.debug(`[COMPOSER][HTTP(M)] Registered handler for url "${url}"`);
	}

	response(method: string, url: string, fragment?: any) {
		console.log(`${method} for ${url}`)
		let error = {
			status: 404,
			code: 404,
			message: 'Requested resource was not found.',
			data: {}
		};
		console.log(this.handlers[url]);
		if(method === 'GET'){
			if(this.handlers[url]) {
				let items = this.handlers[url].data;
				if(this.handlers[url].is_array) {
					items = [];
					let offset = fragment && !isNaN(fragment['offset']) ? +fragment['offset'] : 0;
					let limit = fragment && !isNaN(fragment['offset']) ? +fragment['offset'] : 500;
					for(let i = offset; i < this.handlers[url].data.length && items.length < limit; i++) {
						items.push(this.handlers[url].data[i]);
					}
					return {
						status: 200,
						code: 200,
						results : items
					};
				}
				if(COMPOSER_SETTINGS.get('debug')) console.debug(`[COMPOSER][HTTP(M)] ${method} Response for url "${url}"`, items);
				return items
			} else {
				if(COMPOSER_SETTINGS.get('debug')) console.debug(`[COMPOSER][HTTP(M)] ${method} Response for url "${url}"`, error);
				return error;
			}
		} else {
			if(COMPOSER_SETTINGS.get('debug')) console.debug(`[COMPOSER][HTTP(M)] ${method} Response for url "${url}"`, 'Success');
			return {
				status: 200,
				code: 200,
				message: 'Ok',
				data: {}
			}
		}
	}
}

export let MOCK_REQ_HANDLER = new MockRequestHandler();

export class MockRequest {
	resp_fn: any = null;
	responce: any = null;
	fragments: any = {};

	constructor(private method: string, private url: string, private data: any, private options: any) {
		this.getFragments(url);
			// Remove origin from URL
		if(url.indexOf('http') == 0) {
			url = '/' + url.split('/').slice(3).join('/');
		}
		this.getFragments(url);
	}

	getFragments(url: string) {
		let url_parts = url.split('?');
		this.url = url_parts[0];
		let frag = url_parts.length > 1 ? url_parts[1] : null;
		let parts: any = {};
		if(frag) {
			let params = frag.split('&');
			if(params.length > 0) {
				for(let item of params) {
					let pair = item.split('=');
					if(pair.length === 2) {
						parts[pair[0]] = parts[pair[1]];
					}
				}
			}
		}
		this.fragments = parts;
	}

	map(fn: (response: any) => void) {
		this.resp_fn = fn;
		return this;
	}

	subscribe(data: (value: {}) => void, error: (error: {}) => void, complete: () => void) : any {
		return new Observable((observer) => {
			setTimeout(() => {
				let res = MOCK_REQ_HANDLER.response(this.method, this.url, this.fragments);
				if(res.status === 200){
					observer.next(res);
				} else {
					observer.error(res);
				}
				setTimeout(() => {
					observer.complete();
				}, 200);
			}, 200);
		}).subscribe(data, error, complete);
	}
}

@Injectable()
export class MockHttp {

	constructor() {
        setTimeout(() => {
        	initialiseMockClasses();
        }, 200);
	}

	get(url: string, options: any) {
		if(COMPOSER_SETTINGS.get('debug')) console.debug(`[COMPOSER][HTTP(M)] GET Request made to url "${url}"`);
		return new MockRequest('GET', url, null, options);
	}

	post(url: string, options: any) {
		if(COMPOSER_SETTINGS.get('debug')) console.debug(`[COMPOSER][HTTP(M)] GET Request made to url "${url}"`);
		return new MockRequest('POST', url, null, options);
	}

	put(url: string, data: any, options: any) {
		if(COMPOSER_SETTINGS.get('debug')) console.debug(`[COMPOSER][HTTP(M)] GET Request made to url "${url}"`);
		return new MockRequest('PUT', url, null, options);
	}

	delete(url: string, options: any) {
		if(COMPOSER_SETTINGS.get('debug')) console.debug(`[COMPOSER][HTTP(M)] GET Request made to url "${url}"`);
		return new MockRequest('DELETE', url, null, options);
	}
}