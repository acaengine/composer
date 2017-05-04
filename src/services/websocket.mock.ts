/**
 * @Author: Alex Sorafumo
 * @Date:   20/10/2016 2:32 PM
 * @Email:  alex@yuion.net
 * @Filename: websocket.mock.ts
 * @Last modified by:   Alex Sorafumo
 * @Last modified time: 25/01/2017 1:36 PM
 */

 import { watch, unwatch } from 'watch-object';

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

 import { COMPOSER } from '../settings';

 export class MockWebSocketInterface {
     private static retries: number = 0;
     private counters: number[];
     private end_point: string;
     private serv: any;
     private req_id = 0;
     private uri: string;
     private connected = true;
     private reconnected = false;
     private connect_check: any = null;
     private connect_promise: any = null;
     private connecting: boolean = false;
     private requests: any = {};
     private fixed: boolean = false;
     private io: any;
     private keepAliveInterval: any;
     private auth: any;
     private watching: any = {};

     private systems: any[] = [];

     constructor(srv: any, auth: any, fixed: boolean = false, host: string = location.hostname, port: string = '3000') {
         this.fixed = fixed;
         this.serv = srv;
         COMPOSER.observe('control').subscribe((data: any) => {
             this.systems = data;
         });
         this.setup(auth, host, port);
     }
    /**
     * Initialises websocket
     * @param  {any}       auth
     * @param  {string =    location.hostname} host Hostname for the websocket to connect to
     * @param  {string =    '3000'}            port Port that the websocket is listening on
     * @return {void}
     */
     public setup(auth: any, host: string = location.hostname, port: string = '3000') {
         this.auth = auth;
         const protocol = (port === '443' ? 'wss://' : 'ws://');
         const use_port = (port === '80' || port === '443' ? '' : (':' + port));
         this.end_point = protocol + host + use_port;
         this.uri = this.end_point + '/control/websocket';
         this.setupSystems();
     }
    /**
     * Called when the websocket is connected
     * @param  {any}    evt Event returned by the websocket
     * @return {void}
     */
     public onopen(evt: any) {
         this.connected = true;
         COMPOSER.log('WS(M)', 'Connected');
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
     public onclose(evt: any) {
         this.connected = false;
         COMPOSER.log('WS(M)', 'Closed');
         this.io = null;
         this.stopKeepAlive();
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
     public bind(sys_id: string, mod_id: string, i: number, name: string, callback: () => void) {
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
     public unbind(sys_id: string, mod_id: string, i: number, name: string, callback: () => void) {
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
         return new Promise((resolve, reject) => {
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
     * Loads mock systems into variable
     * @return {void}
     */
     private setupSystems() {
         if (!this.systems || this.systems.length <= 0) {
             setTimeout(() => {
                 this.setupSystems();
             }, 200);
         }
     }
    /**
     * Imitates the connecting of a real websocket
     * @return {void}
     */
     private connect() {
         if (!this.connect_promise) {
             this.connect_promise = new Promise((resolve, reject) => {
                 if (this.connecting) {
                     reject({message: 'Already attempting to connect to websocket.'});
                     this.connect_promise = null;
                     return;
                 }
                 this.connecting = true;
                 setTimeout(() => {
                     this.onopen({});
                     // Prevent another connection attempt for 100ms
                     setTimeout(() => { this.connecting = false; }, 100);
                     if (!this.connect_check) {
                         this.connect_check = setInterval(() => { this.reconnect(); }, 3 * 1000);
                     }
                 }, Math.floor(Math.random() * 1000) + 200);
             });
         }
         return this.connect_promise;
     }
    /**
     * Imitation of reconnect in real websocket
     * @return {[type]} [description]
     */
     private reconnect() {
         return;
        /*
        if (this.io === null || this.io.readyState === this.io.CLOSED) {
            if(COMPOSER.get('debug')) console.debug('[COMPOSER][WS(M)] Reconnecting...');
            this.connect();
            this.reconnected = true;
        }
        //*/
    }

    private startKeepAlive() {
        this.keepAliveInterval = setInterval(() => {
            this.onmessage({ data: PONG });
        }, KEEP_ALIVE_TIMER_SECONDS);
    }

    private stopKeepAlive() {
        clearInterval(this.keepAliveInterval);
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
         // Process message
         if (msg.type === SUCCESS || msg.type === ERROR || msg.type === NOTIFY) {
             meta = msg.meta;
             const meta_list = `${msg.type}(${meta.id}). ${meta.sys}, ${meta.mod} ${meta.index}, ${meta.name}`;
             COMPOSER.log('WS(M)', `Recieved ${meta_list}`, msg.value);
             if (msg.type === SUCCESS) {
                 if (this.requests[msg.id] && this.requests[msg.id].resolve) {
                     this.requests[msg.id].resolve(msg.value);
                 }
             } else if (msg.type === ERROR) {
                 if (this.requests[msg.id] && this.requests[msg.id].resolve) {
                     this.requests[msg.id].reject(msg.msg);
                 }
             }
             if (this.requests[msg.id]) {
                 delete this.requests[msg.id];
             }
             if (!meta) { return this.fail(msg, 'meta'); }
             system = this.serv.get(meta.sys);
             if (!system) { return this.fail(msg, 'system'); }
             module = system.get(meta.mod, meta.index);
             if (!module) { return this.fail(msg, 'module'); }
             // Update Binding
             binding = module.get(meta.name);
             if (!binding) { return this.fail(msg, 'binding'); }
             else { binding[msg.type](msg); }
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
         COMPOSER.log('WS(M)', `Failed(${type}): ${JSON.stringify(msg)}`);
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
     private sendRequest(type: any, system: any, mod: any, index: any, name: any, args: any[] = []): any {
         if (!this.connected) {
             COMPOSER.log('WS(M)', 'Not connected to websocket. Attempting to connect to websocket');
             return this.connect().then(() => {
                 setTimeout(() => {
                     return this.sendRequest(type, system, mod, index, name, args);
                 }, 200);
             }, () => -1);
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
         COMPOSER.log('WS(M)', `Sent ${type} request(${this.req_id}). ${system}, ${mod} ${index}, ${name}`, args);
         if (args !== null) { request.args = args; }
         setTimeout(() => {
             this.respondTo(type, request);
         }, 200);

         return this.req_id;
     }
    /**
     * Imitates a status variable change on the server
     * @param  {any}    r     Request made to the server
     * @param  {any}    value New value of status variable
     * @return {void}
     */
     private notifyChange(r: any, value: any) {
         const evt_ex = { data: JSON.stringify({
             id: r.id,
             type: NOTIFY,
             meta: r,
             value,
         })};
         setTimeout(() => {
             this.onmessage(evt_ex);
         }, 100);
     }
    /**
     * Imitates a response from the server to any request made
     * @param  {string} type Request type
     * @param  {any}    r    Request body
     * @return {void}
     */
     private respondTo(type: string, r: any) {
         let evt: any = {};
         let evt_ex: any = null;
         switch (type) {
             case BIND:
             if (this.systems && this.systems[r.sys] && this.systems[r.sys][r.mod] &&
                 this.systems[r.sys][r.mod][r.index - 1]) {
                 const val = this.systems[r.sys][r.mod][r.index - 1][r.name];
                 evt = { data: JSON.stringify({
                     id: r.id,
                     type: SUCCESS,
                     meta: r,
                     value: val === undefined ? null : val,
                 })};
                 evt_ex = { data: JSON.stringify({
                     id: r.id,
                     type: NOTIFY,
                     meta: r,
                     value: val === undefined ? null : val,
                 })};
                 console.log(this.watching[`${r.sys},${r.mod},${r.index - 1},${r.name}`]);
                 if (!this.watching[`${r.sys},${r.mod},${r.index - 1},${r.name}`]) {
                     this.watching[`${r.sys},${r.mod},${r.index - 1},${r.name}`] = true;
                     console.log(`Watching ${r.sys},${r.mod},${r.index - 1},${r.name}`);
                     setTimeout(() => {
                         watch(this.systems[r.sys][r.mod][r.index - 1], r.name, (newval: any, oldval: any) => {
                             this.notifyChange(r, newval);
                         });
                     }, 100);
                 } else {
                     setTimeout(() => {
                        this.notifyChange(r, this.systems[r.sys][r.mod][r.index - 1][r.name]);
                     });
                 }
             }
             break;
             case UNBIND:
             if (this.systems && this.systems[r.sys] && this.systems[r.sys][r.mod]) {
                 evt = { data: JSON.stringify({
                     id: r.id,
                     type: SUCCESS,
                     meta: r,
                     value: this.systems[r.sys][r.mod][r.index - 1][r.name],
                 })};
                 if (this.watching[`${r.sys},${r.mod},${r.index - 1},${r.name}`]) {
                         /*
                     console.log(`Unwatching ${r.sys},${r.mod},${r.index - 1},${r.name}`);
                     this.watching[`${r.sys},${r.mod},${r.index - 1},${r.name}`] = false;
                      unwatch(this.systems[r.sys][r.mod][r.index - 1], r.name);
                      // */
                  }
             }
             break;
             case EXEC:
             if (this.systems && this.systems[r.sys] && this.systems[r.sys][r.mod] &&
                 this.systems[r.sys][r.mod][r.index - 1]) {
                 if (this.systems[r.sys][r.mod][r.index - 1].$system === undefined) {
                     this.systems[r.sys][r.mod][r.index - 1].$system = this.systems[r.sys];
                 }
                 const fn = this.systems[r.sys][r.mod][r.index - 1][`$${r.name}`];
                 if (fn instanceof Function) {
                     evt = { data: JSON.stringify({
                         id: r.id,
                         type: SUCCESS,
                         meta: r,
                         value: (fn as any).apply(this.systems[r.sys][r.mod][r.index - 1], r.args),
                     })};
                 } else {
                     this.systems[r.sys][r.mod][r.index - 1][r.name] = r.args[0];
                     evt = { data: JSON.stringify({
                         id: r.id,
                         type: SUCCESS,
                         meta: r,
                         value: this.systems[r.sys][r.mod][r.index - 1][r.name],
                     })};
                 }
             }
             break;
             case DEBUG:
             evt = {
                 data: JSON.stringify({
                     id: r.id,
                     type: SUCCESS,
                     meta: r,
                     value: r.args[0],
                 }),
             };
             break;
             default:
             break;
         }
         this.onmessage(evt);
         if (evt_ex) {
             setTimeout(() => {
                 this.onmessage(evt_ex);
             }, 100);
         }
     }

 }

 export let $WebSocketMock = MockWebSocketInterface;
