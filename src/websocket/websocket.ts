import { $WebSocket } from 'angular2-websocket/angular2-websocket'

const BIND    = 'bind';
const UNBIND  = 'unbind';
const PONG    = 'ping';
const EXEC    = 'exec';
const SUCCESS = 'success';
const ERROR   = 'error';
const NOTIFY  = 'notify';

// timers
const SECONDS = 1000;
const RECONNECT_TIMER_SECONDS  = 5 * SECONDS;
const KEEP_ALIVE_TIMER_SECONDS = 60 * SECONDS;

export class  Web_Socket {
    counters : number[];
    io : any;
    end_point : string;
    serv : any;
    req_id = 0;
    uri : string;
    connected = false;
    keepAliveInterval : any;

    constructor(srv: any, host : string, port : string = '443'){
        this.end_point = 'wss://' + host + ':' + port;
        this.serv = srv;
        this.uri = this.end_point + '';
        this.io = new $WebSocket(this.uri);
        this.io.onmessage = this.onmessage;
        this.io.onclose   = this.onclose;
        this.io.onopen    = this.onopen;
    }


    onopen(evt) {
        this.connected = true;
        this.startKeepAlive();
    }

    onclose(evt) {
        this.connected = false;
        this.io = null;
        this.stopKeepAlive();
    }

    onmessage(evt) {
        var msg, meta, system, module, binding;

        // message data will either be the string 'PONG', or json
        // data with an associated type
        if (evt.data == PONG) {
            return;
        } else {
            msg = JSON.parse(evt.data);
        }

        if (msg.type == SUCCESS || msg.type == ERROR || msg.type == NOTIFY) {
            meta = msg.meta;
            if (!meta) return this.fail(msg);
            system = this.serv.get(meta.sys);
            if(!system) return this.fail(msg);
            module = system.get(meta.mod, meta.index);
            if(!module) return this.fail(msg);
            binding = module.get(meta.name);
            if(!binding) return this.fail(msg);
            else binding[meta.type](msg);
        } else if (msg.type == 'debug') { }
    }

    fail (msg){
        console.error('Unable to update system.');
        console.log(msg);
    }

    startKeepAlive () {
        this.keepAliveInterval = window.setInterval(() => {
            this.io.send(PONG);
        }, KEEP_ALIVE_TIMER_SECONDS);
    }

    stopKeepAlive (){
        window.clearInterval(this.keepAliveInterval);
    }

    sendRequest(type, system, mod, index, name, args) {
        if (!this.connected)
        return false;

        this.req_id += 1;

        var request = {
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

        return true;
    };

    bind(sys_id : string, mod_id : string, i : number, name : string, callback : Function){
        return this.sendRequest(BIND, sys_id, mod_id, i, name, null);
    }

    unbind(sys_id : string, mod_id : string, i : number, name : string, callback : Function){
        return this.sendRequest(UNBIND, sys_id, mod_id, i, name, null);
    }

    exec(sys_id : string, mod_id : string, i : number, name : string, fn : any, args : any){
        return this.sendRequest(EXEC, sys_id, mod_id, i, name, args);
    }

}
