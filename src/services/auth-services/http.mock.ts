/*
* @Author: Alex Sorafumo
* @Date:   2017-03-21 16:57:15
* @Last Modified by:   Alex Sorafumo
* @Last Modified time: 2017-04-06 12:02:09
*/

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { COMPOSER_SETTINGS } from '../../settings';
import { initialiseMockClasses } from './mock.classes';

export class MockRequestHandler {
	private handlers: any = {};
	constructor() {
	}

	register(url: string, data: any, fn?: (frag: any, data: any) => any) {
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
			fn: fn
		};
		if(COMPOSER_SETTINGS.get('debug')) console.debug(`[COMPOSER][HTTP(M)] Registered handler for url "${url}"`);
	}

	response(method: string, url: string, fragment?: any) {
		let error = {
			status: 404,
			code: 404,
			message: 'Requested resource was not found.',
			data: {}
		};
		if(method === 'GET'){
			if(this.handlers[url]) {
				let resp = this.handlers[url].fn ? this.handlers[url].fn(fragment, this.handlers[url].data) : this.handlers[url].data;
				if(COMPOSER_SETTINGS.get('debug')) console.debug(`[COMPOSER][HTTP(M)] Response to ${method} for url "${url}"`, resp);
				return resp;
			} else {
				if(COMPOSER_SETTINGS.get('debug')) console.debug(`[COMPOSER][HTTP(M)] Response to ${method} for url "${url}"`, error);
				return error;
			}
		} else {
			if(COMPOSER_SETTINGS.get('debug')) console.debug(`[COMPOSER][HTTP(M)] Response to ${method} for url "${url}"`, 'Success');
			return {
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
						parts[pair[0]] = pair[1];
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
				if(res.status === 400 || res.status === 404){
					observer.error(res);
				} else {
					observer.next(res);
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