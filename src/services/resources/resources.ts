
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ACAHttp } from '../auth-services';
import { Observable } from 'rxjs/Observable';

let common_headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
let GET = 'GET';
let POST = 'POST';
let PUT = 'PUT';
let DELETE = 'DELETE';
let common_crud = {
        // See defaults: http://docs.angularjs.org/api/ngResource.$resource
        get: {
            method: GET,
            headers: common_headers
        },
        query:  {
            method: GET,
            headers: common_headers
        },
        save: {
            method: POST,
            headers: common_headers
        },
        create: {
            method: POST,
            headers: common_headers
        },
        send: {
            method: POST,
            headers: common_headers
        },
        update: {
            method: PUT,
            headers: common_headers
        },
        task: {
            method: POST,
            headers: common_headers
        },
        remove: {
            method: DELETE,
            headers: common_headers
        },
        delete: {
            method: DELETE,
            headers: common_headers
        }
    };

export class Resource {
    factory: any;
    url: any;
    id: any;
    constructor(factory: any, data: any, url: any){
        this.factory = factory;
        this.url = url;
        if(typeof data === 'object'){
            let keys = Object.keys(data);
            for(var i = 0; i < keys.length; i++){
                this[keys[i]] = data[keys[i]];
            }
        }
    }

    save(){
        if(!this.url || this.id === undefined) {
            return {};
        }
            // Remember class related variables
        let f = this.factory; let s = this.save; let url = this.url;
            // Remove class related variables
        delete this.save; delete this.factory; delete this.url;
        let data = JSON.parse(JSON.stringify(this));
            // Re-add class related variables
        this.save = s; this.factory = f; this.url = url;
        return (new Promise((resolve, reject) => {
            let result;
            let method = JSON.parse(JSON.stringify(common_crud.save));
            method.url = url;
            this.factory._put(common_crud.save, { id: this.id }, data).subscribe(
                data => result = data,
                err => reject(err),
                () => resolve(result)
            );
        })).then((res) => { return res; }, (err) => { return err; });
    }
}

class ResourceFactory {
    type: string;
    private url: string;
    public params: any;
    methods: any;
    keys: any;
    resources: any;

    constructor(url: string, params: any, methods: any, private http: ACAHttp) {
        //*
        this.url = url;
        this.methods = methods;
        this.params = params;
        let keys = Object.keys(methods);
        for(var i = 0; i < keys.length; i++){
            let func;
            switch(this.methods[keys[i]].method) {
                case GET:
                    func = (key) => {
                        this[key] = (params) => {
                            return this._get(this.methods[key], params);
                        }
                    };
                    func(keys[i]);
                    break;
                case POST:
                    func = (key) => {
                        this[key] = (params, data) => {
                            return this._post(this.methods[key], params, data);
                        }
                    };
                    func(keys[i]);
                    break;
                case PUT:
                    func = (key) => {
                        this[key] = (params, data) => {
                            return this._put(this.methods[key], params, data);
                        }
                    };
                    func(keys[i]);
                    break;
                case DELETE:
                    func = (key) => {
                        this[key] = (params) => {
                            return this._delete(this.methods[key], params);
                        }
                    };
                    func(keys[i]);
                    break;
            }
        }
        //*/
    }

    private createUrl(params, url?) {
        let gkeys = Object.keys(this.params);
        if(params === undefined || params === null) params = {};
        let keys = Object.keys(params);
        let outUrl = url ? url : this.url;
            //Add url parameters
        for(let i = 0; i < gkeys.length; i++) {
            if(this.params[gkeys[i]].indexOf('@') === 0){ // User defined parameter
                let value = (params[this.params[gkeys[i]].substr(1)] ? '/' + params[this.params[gkeys[i]].substr(1)] : '');
                outUrl = outUrl.replace('/:' + gkeys[i], value);
            } else { // Developer defined parameter
                let value = this.params[gkeys[i]] ? '/' + this.params[gkeys[i]] : '';
                outUrl = outUrl.replace('/:' + gkeys[i], value);
            }
        }
            //Add query parameters
        let first = true;
        let query = '?';
        for(let j = 0; j < keys.length; j++){
            if(gkeys.indexOf(keys[j]) < 0){
                if(!first) query += '&';
                query += keys[j] + '=' + params[keys[j]];
            }
        }
        if(query.length > 1) outUrl += query;
        return outUrl;
    }

    processData(data: any, url: string, isArray?: boolean){
        let result, i, k;
        if(isArray === true){
            result = [];
            for(i = 0; i < data.length; i++){
                result.push(new Resource(this, data[i], url));
            }
        } else {
            result = new Resource(this, data, url);
        }
        return result;
    }

    _get(method, params) {
        let url = method.url ? this.createUrl(params, method.url) : this.createUrl(params);
        return new Promise((resolve, reject) => {
            let result;
            this.http.get(url, method.headers).subscribe(
                data => result = this.processData(data, url, method.isArray),
                err => reject(err),
                () => resolve(result)
            );
        });
    }

    _post(method, params, data) {
        let url = this.createUrl(params);
        return new Promise((resolve, reject) => {
            let result;
            this.http.post(url, data, method.headers).subscribe(
                data => result = this.processData(data, url, method.isArray),
                err => reject(err),
                () => resolve(result)
            );
        });

    }

    _put(method, params, data) {
        let url = this.createUrl(params);
        return new Promise((resolve, reject) => {
            let result;
            this.http.put(url, data, method.headers).subscribe(
                data => result = this.processData(data, url, method.isArray),
                err => reject(err),
                () => resolve(result)
            );
        });
    }

    _delete(method, params) {
        let url = this.createUrl(params);
        return new Promise((resolve, reject) => {
            let result;
            this.http.delete(url, method.headers).subscribe(
                data => result = this.processData(data, url, method.isArray),
                err => reject(err),
                () => resolve(result)
            );
        });
    }

    auth(){
        return this.http.isLoggedIn();
    }


}

@Injectable()
export class Resources {
    factories: any;
    url: string;
    authLoaded: boolean = false;
    constructor(public http: ACAHttp, private http_unauth: Http) {

    }

    initAuth(resolve: any, reject: any) {
        let parts = this.url.split('/');
        let uri = parts.splice(0, 3).join('/');
        let base_el = document.getElementsByTagName('base')[0];
        let base = base_el ? (base_el.href ? base_el.href : '/') : '/';
        let redirect = base.indexOf(location.origin) < 0 ? (location.origin + base) : base;
        this.get('Authority').get_authority().then((auth) => {
        	let url = encodeURIComponent(document.location.href);
        	console.log(auth);
        	url = auth.login_url.replace('{{url}}', url);
	        this.http.setupOAuth( 
	        	`${uri}/auth/oauth/authorize`, 
	        	`${uri}/auth/token`, 
	        	`${redirect}oauth-resp.html`, 
	        	this.http.hash(`${redirect}oauth-resp.html`), 
	        	(url[0] === '/' ? (uri + url) : url) 
	        );
	        if(auth.session) this.http.setLoginStatus(auth.session);
   		 	this.authLoaded = true;
        	this.http.tryLogin();
        	resolve();
        }, (err) => {
        	console.error('ACA_COMPOSER_RESOURCE: Error getting authority.');
        	console.error(err);
	        this.http.setupOAuth(
	        	`${uri}/auth/oauth/authorize`, 
	        	`${uri}/auth/token`, 
	        	`${redirect}oauth-resp.html`, 
	        	this.http.hash(`${redirect}oauth-resp.html`), 
	        	`${uri}/auth/login`);
        	this.http.tryLogin();
        	reject(err);
        })
    }

    init(url_base?: string) {
    	return new Promise((resolve, reject) => {
	        if(!url_base) this.url = window.location.origin + '/';
	        else this.url = url_base;
	        let custom: any;
	            // Factory for API Modules
	        this.new('Module', this.url + '/api/modules/:id/:task', {
	            id: '@id',
	            task: '@_task'
	        }, common_crud);
	            // Factory for System Modules
	        this.new('SystemModule', this.url + '/api/systems/:sys_id/modules/:mod_id', {
	            mod_id: '@module_id',
	            sys_id: '@system_id'
	        }, common_crud);
	            // Factory for API Triggers
	        this.new('Trigger', this.url + '/api/triggers/:id', {
	            id: '@id'
	        }, common_crud);
	            // Factory for system triggers
	        custom = JSON.parse(JSON.stringify(common_crud));
	        custom.query = {
	            method: GET,
	            headers: common_headers,
	            url: this.url + '/api/system_triggers'
	        }
	        this.new('SystemTrigger', this.url + '/api/triggers/:id', {
	            id: '@id'
	        }, custom);
	            // Factory for System
	        custom = JSON.parse(JSON.stringify(common_crud));
	        custom.funcs = {
	            method:'GET',
	            headers: common_headers,
	            url: this.url + '/api/systems/:id/funcs'
	        }
	        custom.exec = {
	            method:'POST',
	            headers: common_headers,
	            url: this.url + '/api/systems/:id/exec',
	            isArray: true
	        }
	        custom.types = {
	            method:'GET',
	            headers: common_headers,
	            url: this.url + '/api/systems/:id/types',
	            isArray: true
	        }
	        custom.count = {
	            method:'GET',
	            headers: common_headers,
	            url: this.url + '/api/systems/:id/count'
	        }
	        this.new('System', this.url + '/api/systems/:id/:task', {
	            id: '@id',
	            task: '@_task'
	        }, custom);
	            // Factory for Dependencies
	        this.new('Dependency', this.url + '/api/dependencies/:id/:task', {
	            id: '@id',
	            task: '@_task'
	        }, common_crud);
	            // Factory for Node
	        this.new('Node', this.url + '/api/nodes/:id', {
	            id: '@id'
	        }, common_crud);
	            // Factory for Group
	        this.new('Group', this.url + '/api/groups/:id', {
	            id: '@id'
	        }, common_crud);
	            // Factory for Zone
	        this.new('Zone', this.url + '/api/zones/:id', {
	            id: '@id'
	        }, common_crud);
	            // Factory for Discovery
	        custom = JSON.parse(JSON.stringify(common_crud));
	        custom.scan = {
	            method: 'POST',
	            headers: common_headers,
	            url: this.url + '/api/discovery/scan'
	        }
	        this.new('Discovery', this.url + '/api/discovery/:id', {
	            id: '@id'
	        }, custom);
	            // Factory for Logs
	        custom = JSON.parse(JSON.stringify(common_crud));
	        custom.missing_connections = {
	            method:'GET',
	            headers: common_headers,
	            url: this.url + '/api/logs/missing_connections'
	        },
	        custom.system_logs = {
	            method:'GET',
	            headers: common_headers,
	            url: this.url + '/api/logs/system_logs'
	        }
	        this.new('Log', this.url + '/api/logs/:id', {
	            id: '@id'
	        }, custom);
	            // Factory for User
	        custom = JSON.parse(JSON.stringify(common_crud));
	        custom.current = {
	            method:'GET',
	            headers: common_headers,
	            url: this.url + '/api/users/current'
	        }
	        this.new('User', this.url + '/api/users/:id', {
	            id: '@id'
	        }, custom);

	            // Resource for Authority
	        let auth;
	        auth = {};
	        auth.get_authority = (auth_url?: string) => {
	        	if(!auth_url) auth_url = this.url;
	            return (new Promise((resolve, reject) => {
	                let authority;
	                let parts = auth_url.split('/');
	                let url = parts.splice(0, 3).join('/');
	                this.http_unauth.get(url + '/auth/authority').map(res => res.json()).subscribe(
	                    data => authority = data,
	                    err => reject(err),
	                    () => resolve(authority)
	                );
	            }));
	        }
	        if(this.factories === undefined) this.factories = {};
	        this.factories['Authority'] = auth;
	        this.initAuth(resolve, reject);
    	});
    }

    getToken(){
        return this.http.token;
    }

    checkAuth(){
        this.http.checkAuth(() => {
            console.log('Refreshed Auth');
        });
    }

    new(name: string, url: string, params: any, methods: any){
        let factory = new ResourceFactory(url, params, methods, this.http);
        if(this.factories === undefined) this.factories = {};
        this.factories[name] = factory;
    }

    get(name: string){
        return this.factories && this.factories[name] ? this.factories[name] : null;
    }
}
