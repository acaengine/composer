/**
* @Author: Alex Sorafumo
* @Date:   19/10/2016 10:47 AM
* @Email:  alex@yuion.net
* @Filename: websocket.ts
* @Last modified by:   alex.sorafumo
* @Last modified time: 20/01/2017 9:24 AM
*/

const BIND   = 'bind';
const UNBIND = 'unbind';
const DEBUG = 'debug';
const IGNORE = 'ignore';
const PONG   = 'pong';
const EXEC   = 'exec';
const SUCCESS = 'success';
const ERROR   = 'error';
const NOTIFY  = 'notify';

// timers
const SECONDS = 1000;
const RECONNECT_TIMER  = 5 * SECONDS;
const KEEP_ALIVE_TIMER = 60 * SECONDS;

export class WebSocketInterface {
    counters: number[];
    private io: any = null;
    end_point: string;
    serv: any;
    req_id = 0;
    uri: string;
    connected = false;
    private keepAliveInterval: any;
    private auth: any;
    reconnected = false;
    connect_check: any = null;
    connect_promise: any = null;
    requests: any = {};
    static retries: number = 0;
    fixed: boolean = false;

    constructor(srv: any, auth: any, fixed: boolean = false, host: string = location.hostname, port: string = '3000'){
        this.fixed = fixed;
        this.serv = srv;
        this.setup(auth, host, port);
    }

    setup(auth: any, host: string = location.hostname, port: string = '3000') {
        this.auth = auth;
        this.end_point = (port === '443' ? 'wss://' : 'ws://') + host + (port === '80' || port === '443' ? '' : (':' + port));
        this.uri = this.end_point + '/control/websocket';
        if(this.auth !== undefined && this.auth !== null){
            this.auth.getToken();
        }
    }

    connect() {
        if(!this.connect_promise) {
            this.connect_promise = new Promise((resolve, reject) => {
                if(this.io && this.io.readyState !== this.io.CLOSED) {
                    if(this.io.readyState === this.io.CONNECTING) {
                        reject({message: 'Already attempting to connect to websocket.'});
                        this.connect_promise = null;
                        return;
                    } else if(this.io.readyState === this.io.OPEN){
                        this.connected = true;
                        this.connect_promise = null;
                        resolve();
                        return;
                    } else if(this.io.readyState === this.io.CLOSING){
                        this.connect_promise = null;
                        reject({message: 'Websocket is closing'});
                        return;
                    }
                } else {
                    if(this.auth) {
        	            this.auth.getToken().then((token: any) => {
        	                if(token){
        	                    let uri = this.uri;
        	                        //Setup URI
        	                    uri += '?bearer_token=' + token;
                                if(this.fixed) {
                                    uri += '&fixed_device=true';
                                }
        	                    let search = window.location.search;
        	                    if(search.indexOf('fixed_device') >= 0){
        	                        uri += '&fixed_device=true';
        	                    }
                                if(window['debug']) console.debug('[COMPOSER][WS] Building websocket...');
        	                        //Create Web Socket
        	                    this.io = new WebSocket(uri);
        	                    this.io.onmessage = (evt: any) => { this.onmessage(evt); }
        	                    this.io.onclose = (evt: any) => { this.onclose(evt); }
        	                    this.io.onopen = (evt: any) => {
                                    this.onopen(evt);
                                    setTimeout(() => {
                                        this.connected = true;
                                        resolve();
                                    }, 100);
                                }
        	                    this.io.onerror = (evt: any) => {
                                    this.serv.r.checkAuth();
                                    this.io = null;
                                    reject();
                                }
                                this.connect_promise = null;
        	                } else {
        	                    setTimeout(() => { this.connect(); }, 200) ;
                                this.connect_promise = null;
        	                    reject();
        	                }
        	            });
                    } else {
        	                //Create WebSocket
        	            this.io = new WebSocket(this.uri);
        	            this.io.onmessage = (evt: any) => { this.onmessage(evt); }
        	            this.io.onclose = (evt: any) => { this.onclose(evt); }
        	            this.io.onopen = (evt: any) => {
                            this.onopen(evt);
                            setTimeout(() => {
                                this.connected = true;
                                resolve();
                            }, 100);
                        }
        	            this.io.onerror = (evt: any) => {
                            this.serv.r.checkAuth();
                            this.io = null;
                            reject();
                        }
                        this.connect_promise = null;
                    }
                }
    	        if(!this.connect_check) this.connect_check = setInterval(() => { this.reconnect(); }, RECONNECT_TIMER);
        	});
        }
        return this.connect_promise;
    }

    reconnect() {
        if (this.io == null || this.io.readyState === this.io.CLOSED){
            if(window['debug']) console.debug('[COMPOSER][WS] Reconnecting websocket...');
            this.connect();
            this.reconnected = true;
        }
    };

    startKeepAlive () {
        this.keepAliveInterval = window.setInterval(() => {
            if(this.io) {
                this.io.send('ping');
            }
        }, KEEP_ALIVE_TIMER);
    }

    stopKeepAlive (){
        window.clearInterval(this.keepAliveInterval);
    }

    onopen(evt: any) {
        if(window['debug']) console.debug('[COMPOSER][WS] Websocket connected');
        this.startKeepAlive();
            // Rebind the connected systems modules
        if(this.reconnected) this.serv.rebind();
        this.reconnected = false;
    }

    onclose(evt: any) {
        this.connected = false;
        if(window['debug']) console.debug('[COMPOSER][WS] Websocket closed');
        this.io = null;
        this.stopKeepAlive();
    }

    onmessage(evt: any) {
        let msg: any, meta: any, system: any, module: any, binding: any;

        // message data will either be the string 'PONG', or json
        // data with an associated type
        if (evt.data === PONG || !evt.data) {
            return;
        } else {
            msg = JSON.parse(evt.data);
        }

        if (msg.type === SUCCESS || msg.type === ERROR || msg.type === NOTIFY) {
            meta = msg.meta;
            if(window['debug'] && msg.type === ERROR) console.debug(`[COMPOSER][WS] Received Error(${msg.id}). ${msg.msg}`);
            else if(window['debug'] && msg.type === NOTIFY) console.debug(`[COMPOSER][WS] Received Notify(${msg.id}). ${meta.sys}, ${meta.mod} ${meta.index}, ${meta.name}`, msg.value);
            else if(window['debug']) console.debug(`[COMPOSER][WS] Received Success(${msg.id}). Value: ${msg.value}`);
            if(msg.type === SUCCESS) {
                if(this.requests[msg.id] && this.requests[msg.id].resolve) this.requests[msg.id].resolve(msg.value);
            } else if(msg.type === ERROR) {
                if(this.requests[msg.id] && this.requests[msg.id].resolve) this.requests[msg.id].reject(msg.msg);
            }
            if(this.requests[msg.id]) delete this.requests[msg.id];
            if (!meta) return this.fail(msg, 'meta');
            system = this.serv.get(meta.sys);
            if(!system) return this.fail(msg, 'system');
            module = system.get(meta.mod, meta.index);
            if(!module) return this.fail(msg, 'module');
            binding = module.get(meta.name);
            if(!binding) return this.fail(msg, 'binding');
            else binding[msg.type](msg);
        } else if (msg.type === 'debug') { }
        return true;
    }

    fail (msg: any, type: any){
        if(window['debug'] && type !== 'meta') console.error(`[COMPOSER][WS] Failed ${type}. ${JSON.stringify(msg)}`);
        return false;
    }

    sendRequest(type: any, system: any, mod: any, index: any, name: any, args: any = []) :any {
        if (!this.io || this.io.readyState !== this.io.OPEN) {
        	return this.connect().then(() => {
                setTimeout(() => {
            		return this.sendRequest(type, system, mod, index, name, args);
                }, 200);
                WebSocketInterface.retries = 0;
        	}, () => {
                if(window['debug']) console.error(`[COMPOSER][WS] Failed to connect(${type}, ${name})`);
                WebSocketInterface.retries++;
                if(WebSocketInterface.retries > 10) return -1;
                setTimeout(() => {
                    return this.sendRequest(type, system, mod, index, name, args);
                }, 500 * WebSocketInterface.retries);
            });
	    }
        this.req_id += 1;
        if(!(args instanceof Array)) args = [args];
        let request = {
            id:     this.req_id,
            cmd:    type,
            sys:    system,
            mod:    mod,
            index:  index,
            name:   name,
            args:   args
        };
        if(window['debug']) console.debug(`[COMPOSER][WS] Sent ${type} request. ${system}, ${mod}, ${index}, ${name}`, args);

        if (args !== null) request.args = args;
        this.io.send( JSON.stringify(request) );

        return this.req_id;
    };

    bind(sys_id: string, mod_id: string, i: number, name: string, callback: Function){
        return this.sendRequest(BIND, sys_id, mod_id, i, name, null);
    }

    unbind(sys_id: string, mod_id: string, i: number, name: string, callback: Function){
        return this.sendRequest(UNBIND, sys_id, mod_id, i, name, null);
    }

    exec(sys_id: string, mod_id: string, i: number, fn: any, args: any){
        return new Promise((resolve, reject) => {
            let id = this.sendRequest(EXEC, sys_id, mod_id, i, fn, args);
            this.requests[id] = {
                resolve: resolve,
                reject: reject
            };
        })
    }

    debug(sys_id: string, mod_id: string, i: number){
        return this.sendRequest(DEBUG, sys_id, mod_id, i, DEBUG);
    }

    ignore(sys_id: string, mod_id: string, inst: any){
        return this.sendRequest(IGNORE, sys_id, mod_id, null, IGNORE);
    }

}

export let $WebSocket = WebSocketInterface;
