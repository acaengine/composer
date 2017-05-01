/**
 * @Author: Alex Sorafumo
 * @Date:   19/10/2016 10:47 AM
 * @Email:  alex@yuion.net
 * @Filename: websocket.ts
 * @Last modified by:   Alex Sorafumo
 * @Last modified time: 06/02/2017 11:31 AM
 */

 import { COMPOSER } from '../settings';

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
     private static retries: any = {};

     private counters: number[];
     private io: any = null; // Websocket
     private end_point: string; //
     private serv: any; // Parent service
     private req_id = 0;
     private uri: string;
     private connected = false; // Is Websocker connected
     private keepAliveInterval: any;
     private auth: any;
     private reconnected = false;
     private connect_check: any = null;
     private connect_promise: any = null;
     private requests: any = {};
     private fixed: boolean = false;

     constructor(srv: any, auth: any, fixed: boolean = false, host?: string, port?: string) {
         if (!host) {
             host = location.hostname;
         }
         if (!port) {
             port = location.port;
         }
         this.fixed = fixed;
         this.serv = srv;
         this.setup(auth, host, port);
     }

    /**
     * Initialises websocket
     * @param  {any}       auth
     * @param  {string =    location.hostname} host Hostname for the websocket to connect to
     * @param  {string =    '3000'}            port Port that the websocket is listening on
     * @return {void}
     */
     public setup(auth: any, host?: string, port?: string, protocol?: string) {
         if (!host) {
             host = location.hostname;
         }
         if (!port) {
             port = location.port;
         }
         if (!protocol) {
             port = location.protocol;
         }
         this.auth = auth;
         const prot = (protocol === 'https:' ? 'wss://' : 'ws://');
         const use_port = (port === '80' || port === '443' ? '' : (':' + port));
         this.end_point = prot + host + use_port;
         this.uri = this.end_point + '/control/websocket';
     }

    /**
     * Requests a binding to a status variable on the server
     * @param  {string}   sys_id   System to bind to
     * @param  {string}   mod_id   Module to bind to
     * @param  {number}   i        Index of module in the system
     * @param  {string}   name     Name of status variable to bind to
     * @param  {Function} callback Function to call when the binding is successful
     * @return {number}   Returns the id of the request
     */
     public bind(sys_id: string, mod_id: string, i: number, name: string, callback: Function) {
         return this.sendRequest(BIND, sys_id, mod_id, i, name, null);
     }

    /**
     * Requests to unbind to a bound status variable on the server
     * @param  {string}   sys_id   System ID
     * @param  {string}   mod_id   Module name
     * @param  {number}   i        Index of module in the system
     * @param  {string}   name     Name of status variable to unbind
     * @param  {Function} callback Function to call when the unbind is successful
     * @return {number}   Returns the id of the request
     */
     public unbind(sys_id: string, mod_id: string, i: number, name: string, callback: Function) {
         return this.sendRequest(UNBIND, sys_id, mod_id, i, name, null);
     }

    /**
     * Requests to execute a function on the server
     * @param  {string}   sys_id   System ID
     * @param  {string}   mod_id   Module name
     * @param  {number}   i        Index of module in the system
     * @param  {any}      fn       Name of the function to call on the module
     * @param  {any}      args     Arguments to pass to the function being called
     * @return {Promise<any>}   Returns a promise which resolves the result of the call or rejects with an error message
     */
     public exec(sys_id: string, mod_id: string, i: number, fn: any, args: any) {
         return new Promise<any>((resolve, reject) => {
             const id = this.sendRequest(EXEC, sys_id, mod_id, i, fn, args);
             this.requests[id] = {
                 resolve,
                 reject,
             };
         });
     }

    /**
     * Enables debugging on the selected system and module
     * @param  {string} sys_id System ID
     * @param  {string} mod_id Module name
     * @param  {number} i      Index of the module in the system
     * @return {number}        Returns the id of the request made
     */
     public debug(sys_id: string, mod_id: string, i: number) {
         return this.sendRequest(DEBUG, sys_id, mod_id, i, DEBUG);
     }

    /**
     * Sends ignore to the selected system and module
     * @param  {string} sys_id System ID
     * @param  {string} mod_id Module name
     * @param  {number} i      Index of the module in the system
     * @return {number}        Returns the id of the request made
     */
     public ignore(sys_id: string, mod_id: string, inst: any) {
         return this.sendRequest(IGNORE, sys_id, mod_id, null, IGNORE);
     }

    /**
     * Connects to the websocket on the given host and port
     * @return {void}
     */
     private connect(tries: number = 0) {
         if (!this.connect_promise) {
             this.connect_promise = new Promise((resolve, reject) => {
                 if (tries > 10) reject();
                 if (this.io && this.io.readyState !== this.io.CLOSED) {
                     if (this.io.readyState === this.io.CONNECTING) {
                         reject({message: 'Already attempting to connect to websocket.'});
                         this.connect_promise = null;
                         return;
                     } else if (this.io.readyState === this.io.OPEN) {
                         this.connected = true;
                         this.connect_promise = null;
                         resolve();
                         return;
                     } else if (this.io.readyState === this.io.CLOSING) {
                         this.connect_promise = null;
                         reject({message: 'Websocket is closing'});
                         return;
                     }
                 } else {
                     if (this.auth) {
                         this.auth.getToken().then((token: any) => {
                             if (token) {
                                 let uri = this.uri;
                                 //Setup URI
                                 uri += '?bearer_token=' + token;
                                 if (this.fixed) {
                                     uri += '&fixed_device=true';
                                 }
                                 const search = location.search;
                                 if (search.indexOf('fixed_device') >= 0) {
                                     uri += '&fixed_device=true';
                                 }
                                 COMPOSER.log('WS', 'Building websocket...');
                                 //Create Web Socket
                                 this.io = new WebSocket(uri);
                                 this.io.onmessage = (evt: any) => { this.onmessage(evt); };
                                 this.io.onclose = (evt: any) => { this.onclose(evt); };
                                 this.io.onopen = (evt: any) => {
                                     this.onopen(evt);
                                     setTimeout(() => {
                                         this.connected = true;
                                         resolve();
                                     }, 100);
                                 };
                                 this.io.onerror = (evt: any) => {
                                     this.serv.r.checkAuth();
                                     this.io = null;
                                     if (!this.connected) {
                                         reject();
                                     }
                                 };
                                 this.connect_promise = null;
                             } else {
                                 setTimeout(() => {
                                     this.connect(++tries).then(() => {
                                         resolve();
                                     }, () => {
                                         reject();
                                     });
                                 }, 200) ;
                                 this.connect_promise = null;
                             }
                         });
                     } else {
                         //Create WebSocket
                         this.io = new WebSocket(this.uri);
                         this.io.onmessage = (evt: any) => { this.onmessage(evt); };
                         this.io.onclose = (evt: any) => { this.onclose(evt); };
                         this.io.onopen = (evt: any) => {
                             this.onopen(evt);
                             setTimeout(() => {
                                 this.connected = true;
                                 resolve();
                             }, 100);
                         };
                         this.io.onerror = (evt: any) => {
                             this.serv.r.checkAuth();
                             this.io = null;
                             reject();
                         };
                         this.connect_promise = null;
                     }
                 }
                 if (!this.connect_check) {
                     this.connect_check = setInterval(() => { this.reconnect(); }, RECONNECT_TIMER);
                 }
             });
        }
         return this.connect_promise;
    }

    /**
     * Reconnects the websocket is it closes or does not exist
     * @return {void}
     */
     private reconnect() {
         if (this.io == null || this.io.readyState === this.io.CLOSED) {
             COMPOSER.log('WS', 'Reconnecting websocket...');
             this.connect().then(() => { return; }, () => { return; });
             this.reconnected = true;
         }
     }
    /**
     * Starts pings to the server every so often to keep the connection alive
     * @return {void}
     */
     private startKeepAlive() {
         this.keepAliveInterval = setInterval(() => {
             if (this.io) {
                 this.io.send('ping');
             }
         }, KEEP_ALIVE_TIMER);
     }
    /**
     * Stops pings to the server
     * @return {void}
     */
     private stopKeepAlive() {
         clearInterval(this.keepAliveInterval);
     }

    /**
     * Called when the websocket is connected
     * @param  {any}    evt Event returned by the websocket
     * @return {void}
     */
     private onopen(evt: any) {
         COMPOSER.log('WS', 'Websocket connected');
         this.startKeepAlive();
         // Rebind the connected systems modules
         if (this.reconnected) {
             this.serv.rebind();
         }
         this.reconnected = false;
     }

    /**
    * Function that is called when the websocket is disconnected
    * @param  {any}    evt Event returned by the websocket
    * @return {void}
    */
    private onclose(evt: any) {
        this.connected = false;
        COMPOSER.log('WS', 'Websocket closed');
        this.io = null;
        this.stopKeepAlive();
    }

    /**
    * Function that is called when the websocket is receives a message
    * @param  {any}    evt Event returned by the websocket
    * @return {void}
    */
    private onmessage(evt: any) {
        let msg: any;
        let meta: any;
        let system: any;
        let module: any;
        let binding: any;

        // message data will either be the string 'PONG', or json
        // data with an associated type
        if (evt.data === PONG || !evt.data) {
            return;
        } else {
            msg = JSON.parse(evt.data);
        }
        //Process responce message
        if (msg.type === SUCCESS || msg.type === ERROR || msg.type === NOTIFY) {
            meta = msg.meta;
            const meta_list = `${meta.sys}, ${meta.mod} ${meta.index}, ${meta.name}`;
            if (msg.type === ERROR) {
            	COMPOSER.error('WS', `[COMPOSER][WS] Received error(${msg.id}). ${msg.msg}`);
            } else if (msg.type === NOTIFY) {
            	COMPOSER.log(`WS`, `Received notify. ${meta_list} →`, msg.value);
            } else {
                if (meta) {
                    COMPOSER.log(`WS`, `Received success(${msg.id}). ${meta_list}`);
                } else {
                    COMPOSER.log(`WS`, `Received success(${msg.id}). Value: ${msg.value}`);
                }
            }
            if (msg.type === SUCCESS) {
                if (this.requests[msg.id] && this.requests[msg.id].resolve) {
                	this.requests[msg.id].resolve(msg.value);
                }
            } else if (msg.type === ERROR) {
                if (this.requests[msg.id] && this.requests[msg.id].reject) {
                	this.requests[msg.id].reject(msg.msg);
                }
            }
            if (this.requests[msg.id]) {
            	delete this.requests[msg.id];
            }
            if (!meta) {
            	return this.fail(msg, 'meta');
            }
            system = this.serv.get(meta.sys);
            if (!system) {
            	return this.fail(msg, 'system');
            }
            module = system.get(meta.mod, meta.index);
            if (!module) {
            	return this.fail(msg, 'module');
            }
            binding = module.get(meta.name);
            if (!binding) {
            	return this.fail(msg, 'binding');
            } else {
            	binding[msg.type](msg);
            }
        } else if (msg.type === 'debug') {
            return true;
        }
        return true;
    }

    /**
     * Called when processing a message failed
     * @param  {any}    msg  Failure message to display
     * @param  {any}    type Type of message
     * @return {void}
     */
     private fail(msg: any, type: any) {
         COMPOSER.error('WS(M)', `Failed ${type}. ${JSON.stringify(msg)}`);
         return false;
     }

    /**
     * Sends a message through the websocket
     * @param  {any}    type   Message type
     * @param  {any}    system System for message to be sent to
     * @param  {any}    mod    Module for message to be sent to
     * @param  {any}    index  Index of module in system
     * @param  {any}    name   Name of status variable or function on the module
     * @param  {any[] = []} args Arguments to pass to the function on the module
     * @return {any} Returns the id of the request made through the websocket.
     */
     private sendRequest(type: any, system: any, mod: any, index: any, name: any, args: any = []): any {
         if (!this.io || this.io.readyState !== this.io.OPEN) {
             if (!WebSocketInterface.retries[`[${type}] ${system}, ${mod} ${index}, ${name}`]) {
                 WebSocketInterface.retries[`[${type}] ${system}, ${mod} ${index}, ${name}`] = 0;
             }
             return this.connect().then(() => {
                 setTimeout(() => {
                     return this.sendRequest(type, system, mod, index, name, args);
                 }, 200);
                 WebSocketInterface.retries[`[${type}] ${system}, ${mod} ${index}, ${name}`] = 0;
             }, (err: any) => {
                 const error = err ? err.message : 'No error message';
                 COMPOSER.log('WS(M)', `Failed to connect(${type}, ${name}). ${error}`);
                 WebSocketInterface.retries[`[${type}] ${system}, ${mod} ${index}, ${name}`]++;
                 if (WebSocketInterface.retries[`[${type}] ${system}, ${mod} ${index}, ${name}`] > 10) {
                     return -1;
                 }
                 setTimeout(() => {
                     return this.sendRequest(type, system, mod, index, name, args);
                 }, 500 * WebSocketInterface.retries[`[${type}] ${system}, ${mod} ${index}, ${name}`]);
             });
         }
         this.req_id += 1;
         if (!(args instanceof Array)) {
             args = [args];
         }
         const request = {
             id:     this.req_id,
             cmd:    type,
             sys:    system,
             mod,
             index,
             name,
             args,
         };
         COMPOSER.log('WS(M)', `Sent ${type} request(${request.id}). ${system}, ${mod}, ${index}, ${name}`, args);
         if (args !== null) {
             request.args = args;
         }
         this.io.send( JSON.stringify(request) );

         return this.req_id;
     }

 }

 export let $WebSocket = WebSocketInterface;
