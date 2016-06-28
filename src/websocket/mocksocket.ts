
const BIND   = 'bind';
const UNBIND = 'unbind';
const PONG   = 'ping';
const EXEC   = 'exec';
const SUCCESS = 'success';
const ERROR   = 'error';
const NOTIFY  = 'notify';

// timers
const SECONDS = 1000;
const RECONNECT_TIMER_SECONDS  = 5 * SECONDS;
const KEEP_ALIVE_TIMER_SECONDS = 60 * SECONDS;

const MAX_REQUEST_TIME = 200; //Milliseconds

export class  Web_Socket {
    counters : number[];
    io : any;
    end_point : string;
    serv : any;
    keepAliveInterval : any;
    req_id = 0;
    connected = false;

    constructor(srv: any, host : string, port : string = '443'){
        console.log('Constructing Web_Socket');
        this.end_point = 'wss://' + host + ':' + port;
        this.serv = srv;
        this.io = {};
        this.io.onmessage = this.onmessage;
        this.io.onclose   = this.onclose;
        this.io.onopen    = this.onopen;
        var t_out = this.timeout(50);
        console.log(t_out)
        this.onopen();
        //window.setTimeout(this.onopen, 100);
    }

    timeout(num : number = 10){
        return Math.round(Math.random() * MAX_REQUEST_TIME) + num;
    }

    onopen(evt) {
        console.log('Socket Connected.');
        this.connected = true;
        this.startKeepAlive();
    }

    onclose(evt) {
        console.log('Socket Closed.');
        this.connected = false;
        this.io = null;
        this.stopKeepAlive();
    }

    startKeepAlive () {
        this.keepAliveInterval = window.setInterval(() => {
            console.log('Keep Alive: Ping');
            setTimeout(this.onmessage, this.timeout(), { data : PONG } );
        }, KEEP_ALIVE_TIMER_SECONDS);
    }

    stopKeepAlive (){
        window.clearInterval(this.keepAliveInterval);
    }

    onmessage(evt) {
        console.log('Socket received message.');
        var msg, meta, system, module, binding;

        // message data will either be the string 'PONG', or json
        // data with an associated type
        if (evt.data == PONG) {
            console.log('Keep Alive: Pong');
            return;
        } else {
            msg = JSON.parse(evt.data);
            console.log(evt);
        }

        if (msg.type == 'success' || msg.type == 'error' || msg.type == 'notify') {
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
    }

    sendRequest(type, system, mod, index, name, func, args) {
        console.log('Sending Request: ' + type);
        if (!this.connected) return false;

        this.req_id += 1;

        var request = {
            id:     this.req_id,
            cmd:    type,
            sys:    system,
            mod:    mod,
            index:  index,
            name:   name,
            fn:     func,
            args: {}
        };

        if (args !== undefined) request.args = args;
        this.processRequest(request);
        //this.io.send( JSON.stringify(request));
        return true;
    }

    processRequest(req){
        console.log('Processing Request: ');
        var res = {
            data : {
                type : '',
                meta : {}
            }
        };
        if(window.systemData[req.sys] === undefined){
            console.log('System with id:' + req.sys + ' does not exist.');
            res.data.type = ERROR;
        } else {
            var len = window.systemData[req.sys][req.mod].length;
            if(window.systemData[req.sys][req.mod] !== undefined && len >= req.index){
                var mod = window.systemData[req.sys][req.mod];
                res.data.type = SUCCESS;
                res.data.meta = req;
                res.data.meta.type = res.data.type;
                res.data = JSON.stringify(res.data);
                switch(req.cmd){
                    case EXEC:
                        console.log('Executing.');
                        window.systemData[req.sys][req.mod][req.index-1][req.fn](req.args);
                        this.onmessage(res);
                        //setTimeout(this.onmessage, this.timeout(100), res);
                        break;
                    case BIND:
                        console.log('Binding.');
                        this.onmessage(res);
                        //setTimeout(this.onmessage, this.timeout(100), res);
                        break;
                    case UNBIND:
                        console.log('Unbinding.');
                        break;
                }
            } else {
                console.log('No module.');
            }
        }
    }

    bind(sys_id : string, mod_id : string, i : number, name : string, callback : Function){
        return this.sendRequest(BIND, sys_id, mod_id, i, name, null, null);
    }

    unbind(sys_id : string, mod_id : string, i : number, name : string, callback : Function){
        return this.sendRequest(UNBIND, sys_id, mod_id, i, name, null, null);
    }

    exec(sys_id : string, mod_id : string, i : number, name : string, fn : any, args : any){
        return this.sendRequest(EXEC, sys_id, mod_id, i, name, fn, args);
    }

}
