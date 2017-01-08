/**
* @Author: Alex Sorafumo
* @Date:   20/10/2016 2:32 PM
* @Email:  alex@yuion.net
* @Filename: websocket.mock.ts
* @Last modified by:   Alex Sorafumo
* @Last modified time: 15/12/2016 11:41 AM
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
const RECONNECT_TIMER_SECONDS  = 5 * SECONDS;
const KEEP_ALIVE_TIMER_SECONDS = 60 * SECONDS;

/*
 * object.watch polyfill
 *
 * 2012-04-03
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

// object.watch
if (!Object.prototype['watch']) {
	Object.defineProperty(Object.prototype, "watch", {
		  enumerable: false
		, configurable: true
		, writable: false
		, value: function (prop: any, handler: any) {
			var
			  oldval = this[prop]
			, newval = oldval
			, getter = function () {
				return newval;
			}
			, setter = function (val: any) {
				oldval = newval;
				return newval = handler.call(this, prop, oldval, val);
			}
			;

			if (delete this[prop]) { // can't watch constants
				Object.defineProperty(this, prop, {
					  get: getter
					, set: setter
					, enumerable: true
					, configurable: true
				});
			}
		}
	});
}

// object.unwatch
if (!Object.prototype['unwatch']) {
	Object.defineProperty(Object.prototype, "unwatch", {
		  enumerable: false
		, configurable: true
		, writable: false
		, value: function (prop: any) {
			var val = this[prop];
			delete this[prop]; // remove accessors
			this[prop] = val;
		}
	});
}

export class MockWebSocketInterface {
    counters: number[];
    private io: any;
    end_point: string;
    serv: any;
    req_id = 0;
    uri: string;
    connected = true;
    private keepAliveInterval: any;
    private auth: any;
    reconnected = false;
    connect_check: any = null;
    connect_promise: any = null;
    connecting: boolean = false;
    requests: any = {};
    static retries: number = 0;

    systems: any[] = [];

    constructor(srv: any, auth: any, host: string = location.hostname, port: string = '3000'){
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
        this.setupSystems();
    }

    setupSystems() {
        if(window['systemData']) this.systems = window['systemData'];
        else if(window['systemsData']) this.systems = window['systemsData'];
        else if(window['control'] && window['control']['systems']) this.systems = window['control']['systems'];
        else {
            setTimeout(() => {
                this.setupSystems();
            }, 200);
        }
    }

    connect() {
        if(!this.connect_promise) {
            this.connect_promise = new Promise((resolve, reject) => {
                if(this.connecting) {
                    reject({message: 'Already attempting to connect to websocket.'});
                    this.connect_promise = null;
                    return;
                }
                this.connecting = true;
                setTimeout(() => {
                    this.onopen({});
                        // Prevent another connection attempt for 100ms
                    setTimeout(() => { this.connecting = false; }, 100);
        	        if(!this.connect_check) this.connect_check = setInterval(() => { this.reconnect(); }, 3 * 1000);
                }, Math.floor(Math.random() * 4000) + 200);
        	});
        }
        return this.connect_promise;
    }

    reconnect() {
        return;
        /*
        if (this.io == null || this.io.readyState === this.io.CLOSED){
            if(window['debug'] && window['debug_module'].indexOf('COMPOSER_WS') >= 0) console.debug('COMPOSER | Websocket(M): Reconnecting...');
            this.connect();
            this.reconnected = true;
        }
        //*/
    };

    startKeepAlive () {
        this.keepAliveInterval = window.setInterval(() => {
            setTimeout(() => {
                this.onmessage({ data: PONG });
            }, Math.floor(Math.random() * 2000), 50);
        }, KEEP_ALIVE_TIMER_SECONDS);
    }

    stopKeepAlive (){
        window.clearInterval(this.keepAliveInterval);
    }

    onopen(evt: any) {
        this.connected = true;
        if(window['debug'] && window['debug_module'].indexOf('COMPOSER_WS') >= 0) console.debug('COMPOSER | Websocket(M): Connected');
        this.startKeepAlive();
            // Rebind the connected systems modules
        if(this.reconnected) this.serv.rebind();
        this.reconnected = false;
    }

    onclose(evt: any) {
        this.connected = false;
        if(window['debug'] && window['debug_module'].indexOf('COMPOSER_WS') >= 0) console.debug('COMPOSER | Websocket(M): Closed');
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

        if(window['debug'] && window['debug_module'].indexOf('COMPOSER_WS') >= 0) console.debug('COMPOSER | Websocket:', evt);
        if (msg.type === SUCCESS || msg.type === ERROR || msg.type === NOTIFY) {
            meta = msg.meta;
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
            let debugMsg = '';
            if(msg.type === NOTIFY){
                debugMsg = msg.meta.sys + ' -> ' + msg.meta.mod + ' ' + msg.meta.index + ': Status updated: ' + msg.meta.name + ' = ' + msg.value;
                if(module.debugger && module.debugger.enabled) module.debugger.addMessage(debugMsg);
                else if(window['debug'] && window['debug_module'].indexOf('COMPOSER_WS') >= 0) console.debug('COMPOSER | Websocket:', debugMsg);
                //else console.debug(module.now + ' - ' + debugMsg);
            } else {
                debugMsg = msg.type.toUpperCase() + ' ' + msg.id + ': ' + JSON.stringify(msg.meta)
                if(module.debugger && module.debugger.enabled) module.debugger.addMessage(debugMsg);
                else if(window['debug'] && window['debug_module'].indexOf('COMPOSER_WS') >= 0) console.debug('COMPOSER | Websocket:', debugMsg);
                //else console.debug(module.now + ' - ' + debugMsg);
            }
            binding = module.get(meta.name);
            if(!binding) return this.fail(msg, 'binding');
            else binding[msg.type](msg);
        } else if (msg.type === 'debug') { }
        return true;
    }

    fail (msg: any, type: any){
        if(window['debug'] && window['debug_module'].indexOf('COMPOSER_WS') >= 0) console.error(`COMPOSER | Websocket(M): Failed(${type}) - ${JSON.stringify(msg)}`);
        return false;
    }

    sendRequest(type: any, system: any, mod: any, index: any, name: any, args: any = []) :any {
        if(window['debug'] && window['debug_module'].indexOf('COMPOSER_WS') >= 0) console.debug(`COMPOSER | Websocket(M): Performing "${type}" request`);
        if (!this.connected) {
            if(window['debug'] && window['debug_module'].indexOf('COMPOSER_WS') >= 0) console.debug('COMPOSER | Websocket(M): Not connected to websocket. Attempting to connect to websocket');
        	return this.connect().then(() => {
                setTimeout(() => {
            		return this.sendRequest(type, system, mod, index, name, args);
                }, 200);
        	}, () => { return -1; });
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
        if(window['debug'] && window['debug_module'].indexOf('COMPOSER_WS') >= 0) console.debug('COMPOSER | Websocket(M): Sent request', request);

        if (args !== null) request.args = args;
        setTimeout(() => {
            this.respondTo(type, request);
        }, Math.floor(Math.random() * 2000) + 100);

        return this.req_id;
    };

    notifyChange(r: any, value: any) {
        let evt_ex = { data: JSON.stringify({
            id: r.id,
            type: NOTIFY,
            meta: r,
            value: value
        })}
        setTimeout(() => {
            this.onmessage(evt_ex);
        }, Math.floor(Math.random() * 2000) + 100);
    }

    respondTo(type: string, r: any) {
        let evt: any = {};
        let evt_ex: any = null;
        switch(type) {
            case BIND:
                if(this.systems && this.systems[r.sys] && this.systems[r.sys][r.mod]){
                    evt = { data: JSON.stringify({
                        id: r.id,
                        type: SUCCESS,
                        meta: r,
                        value: this.systems[r.sys][r.mod][r.index-1][r.name]
                    })}
                    evt_ex = { data: JSON.stringify({
                        id: r.id,
                        type: NOTIFY,
                        meta: r,
                        value: this.systems[r.sys][r.mod][r.index-1][r.name]
                    })}
                    setTimeout(() => {
                        this.systems[r.sys][r.mod][r.index-1].watch(r.name, (id: string, oldval: any, newval: any) => {
                            console.log(id, oldval, newval);
                            this.notifyChange(r, newval);
                            return newval;
                        });
                    }, 100);
                }
                break;
            case UNBIND:
                if(this.systems && this.systems[r.sys] && this.systems[r.sys][r.mod]){
                    evt = { data: JSON.stringify({
                        id: r.id,
                        type: SUCCESS,
                        meta: r,
                        value: this.systems[r.sys][r.mod][r.index-1][r.name]
                    })}
                    this.systems[r.sys][r.mod][r.index-1].unwatch(r.name);
                }
                break;
            case EXEC:
                if(this.systems && this.systems[r.sys] && this.systems[r.sys][r.mod]){
					if(this.systems[r.sys][r.mod][r.index-1][r.name] instanceof Function){
	                    evt = { data: JSON.stringify({
	                        id: r.id,
	                        type: SUCCESS,
	                        meta: r,
	                        value: this.systems[r.sys][r.mod][r.index-1][r.name](r.args)
	                    })}
					} else {
						this.systems[r.sys][r.mod][r.index-1][r.name] = r.args[0];
	                    evt = { data: JSON.stringify({
	                        id: r.id,
	                        type: SUCCESS,
	                        meta: r,
	                        value: this.systems[r.sys][r.mod][r.index-1][r.name]
	                    })}
					}
                }
                break;
            case DEBUG:
                evt = {
                    data: JSON.stringify({
                        id: r.id,
                        type: SUCCESS,
                        meta: r,
                        value: r.args[0]
                    })
                }
                break;
            default:
                break;
        }
        this.onmessage(evt);
        if(evt_ex) {
            setTimeout(() => {
                this.onmessage(evt_ex);
            }, Math.floor(Math.random() * 2000) + 100);
        }
    }

    bind(sys_id: string, mod_id: string, i: number, name: string, callback: Function){
        if(window['debug'] && window['debug_module'].indexOf('COMPOSER_WS') >= 0) console.debug(`COMPOSER | Websocket(M): Requesting bind for ${sys_id} ${mod_id} ${i} ${name}`);
        return this.sendRequest(BIND, sys_id, mod_id, i, name, null);
    }

    unbind(sys_id: string, mod_id: string, i: number, name: string, callback: Function){
        if(window['debug'] && window['debug_module'].indexOf('COMPOSER_WS') >= 0) console.debug(`COMPOSER | Websocket(M): Requesting unbind for ${sys_id} ${mod_id} ${i} ${name}`);
        return this.sendRequest(UNBIND, sys_id, mod_id, i, name, null);
    }

    exec(sys_id: string, mod_id: string, i: number, fn: any, args: any){
        return new Promise((resolve, reject) => {
            if(window['debug'] && window['debug_module'].indexOf('COMPOSER_WS') >= 0) console.debug(`COMPOSER | Websocket: Exec ${fn} on ${sys_id} ${mod_id} ${i}`);
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

export let $WebSocketMock = MockWebSocketInterface;
