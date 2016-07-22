
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

export class WebSocketInterface {
    counters: number[];
    private io: any;
    end_point: string;
    serv: any;
    req_id = 0;
    uri: string;
    connected = false;
    private keepAliveInterval: any;
    private auth: any;
    reconnected = false;

    constructor(srv: any, auth: any, host: string = location.hostname, port: string = '3000'){
        this.auth = auth;
        this.end_point = (port === '443' ? 'wss://' : 'ws://') + host + ':' + port;
        this.serv = srv;
        this.uri = this.end_point + '/control/websocket';
        this.connect();
        setInterval(() => { this.reconnect(); }, 3 * 1000);
    }

    connect() {
        if(this.auth !== undefined && this.auth !== null){
            this.auth.getToken().then((token) => {
                if(token){
                    let uri = this.uri;
                        //Setup URI
                    uri += '?bearer_token=' + token;
                    let search = window.location.search;
                    if(search.indexOf('fixed_device') >= 0){
                        uri += '&fixed_device=true';
                    }
                        //Create Web Socket
                    this.io = new WebSocket(uri);
                    this.io.onmessage = (evt) => { this.onmessage(evt); }
                    this.io.onclose = (evt) => { this.onclose(evt); }
                    this.io.onopen = (evt) => { this.onopen(evt); }
                    this.io.onerror = (evt) => { this.serv.r.checkAuth(); }
                } else {
                    setTimeout(() => { this.connect(); }, 100) ;
                }
            });
        } else {
                //Create WebSocket
            this.io = new WebSocket(this.uri);
            this.io.onmessage = (evt) => { this.onmessage(evt); }
            this.io.onclose = (evt) => { this.onclose(evt); }
            this.io.onopen = (evt) => { this.onopen(evt); }
            this.io.onerror = (evt) => { this.serv.r.checkAuth(); }
        }
    }

    reconnect() {
        if (this.io == null || this.io.readyState === this.io.CLOSED){
            this.connect();
            this.reconnected = true;
        }
    };

    startKeepAlive () {
        this.keepAliveInterval = window.setInterval(() => {
            this.io.send('ping');
        }, KEEP_ALIVE_TIMER_SECONDS);
    }

    stopKeepAlive (){
        window.clearInterval(this.keepAliveInterval);
    }

    onopen(evt) {
        this.connected = true;
        this.startKeepAlive();
            // Rebind the connected systems modules
        if(this.reconnected) this.serv.rebind();
        this.reconnected = false;
    }

    onclose(evt) {
        this.connected = false;
        this.io = null;
        this.stopKeepAlive();
    }

    onmessage(evt) {
        let msg, meta, system, module, binding;

        // message data will either be the string 'PONG', or json
        // data with an associated type
        if (evt.data === PONG) {
            return;
        } else {
            msg = JSON.parse(evt.data);
        }

        if (msg.type === SUCCESS || msg.type === ERROR || msg.type === NOTIFY) {
            meta = msg.meta;
            if (!meta) return this.fail(msg, 'meta');
            system = this.serv.get(meta.sys);
            if(!system) return this.fail(msg, 'system');
            module = system.get(meta.mod, meta.index);
            if(!module) return this.fail(msg, 'module');
            let debugMsg = '';
            if(msg.type === NOTIFY){
                debugMsg = msg.meta.sys + ' -> ' + msg.meta.mod + ' ' + msg.meta.index + ': Status updated: ' + msg.meta.name + ' = ' + msg.value;
                if(module.debugger && module.debugger.enabled) module.debugger.addMessage(debugMsg);
                //else console.debug(module.now + ' - ' + debugMsg);
            } else {
                debugMsg = msg.type.toUpperCase() + ' ' + msg.id + ': ' + JSON.stringify(msg.meta)
                if(module.debugger && module.debugger.enabled) module.debugger.addMessage(debugMsg);
                //else console.debug(module.now + ' - ' + debugMsg);
            }
            binding = module.get(meta.name);
            if(!binding) return this.fail(msg, 'binding');
            else binding[msg.type](msg);
        } else if (msg.type === 'debug') { }
        return true;
    }

    fail (msg, type){
        /*
        console.error('Unable to update system.');
        console.log(type);
        console.log(msg);
        //*/
        return false;
    }

    sendRequest(type, system, mod, index, name, args?) {
        if (!this.connected)
        return 0;


        this.req_id += 1;

        let request = {
            id:     this.req_id,
            cmd:    type,
            sys:    system,
            mod:    mod,
            index:  index,
            name:   name,
            args:   {}
        };

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
        return this.sendRequest(EXEC, sys_id, mod_id, i, fn, args);
    }

    debug(sys_id: string, mod_id: string, i: number){
        return this.sendRequest(DEBUG, sys_id, mod_id, i, DEBUG);
    }

    ignore(sys_id: string, mod_id: string, inst: any){
        return this.sendRequest(IGNORE, sys_id, mod_id, null, IGNORE);
    }


}
