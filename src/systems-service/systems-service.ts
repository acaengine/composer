import { Injectable } from '@angular/core';
import { $WebSocket } from 'angular2-websocket/angular2-websocket'
import { System } from './classes.ts'

const BIND   = 'bind';
const UNBIND = 'unbind';
const PONG   = 'ping';
const EXEC   = 'exec';

@Injectable({
    providers : [SocketService]
})
export class  SystemsService {
    systems : System[];
    socket : $WebSocket;
    connected = false;
    request_id = 0;

    constructor(host : string = 'localhost', port : string = '443'){
        var uri = 'wss://' + host + ':' + port;
        this.socket = new $WebSocket(uri);
        this.socket.onmessage = this.onmessage;
        this.socket.onclose   = this.onclose;
        this.socket.onopen    = this.onopen;
    }

    onopen(evt) {
        this.connected = true;
        this.startKeepAlive();
    }

    onclose(evt) {
        this.connected = false;
        this.socket = null;
        this.stopKeepAlive();
    }

    onmessage(evt) {
        var msg, meta, system, module, binding;

        // message data will either be the string 'PONG', or json
        // data with an associated type
        if (evt.data == 'ping') {
            return;
        } else {
            msg = JSON.parse(evt.data);
        }

        if (msg.type == 'success' || msg.type == 'error' || msg.type == 'notify') {
            meta = msg.meta;
            if (!meta) return this.fail(msg);
            system = this.get(meta.sys);
            if(!system) return this.fail(msg);
            module = system.get(meta.mod, meta.index);
            if(!module) return this.fail(msg);
            binding = module.get(meta.name);
            if(!binding) return this.fail(msg);
            else binding[meta.type](msg);
        } else if (msg.type == 'debug') { }
    }

    sendRequest(type, system, mod, index, name, args) {
        if (!this.connected)
            return false;

        req_id += 1;

        var request = {
            id:     req_id,
            cmd:    type,
            sys:    system,
            mod:    mod,
            index:  index,
            name:   name
        };

        if (args !== undefined) request.args = args;
        socket.send( JSON.stringify(request) );

        return true;
    };

    bind(sys_id : string, mod_id : string, prop : string, callback : Function){
        return this.sendRequest(BIND, system, mod, index, name);
    }

    unbind(sys_id : string, mod_id : string, prop : string, callback : Function){
        return this.sendRequest(UNBIND, system, mod, index, name);
    }

    exec(sys_id : string, mod_id : string, prop : string, fn : any, data : any){
        return this.sendRequest(EXEC, system, mod, index, func, args);
    }

    get(sys_id : string){
        var system = null;
        //Check if system already exists
        for(var i = 0; i < this.systems.length; i++){
            if(this.systems[i].id == sys_id){
                system = this.systems[i];
            }
        }
        if(system === null) {
            //System not stored create new one.
            system = new System(this, sys_id);
            systems.push(system);
        }
        return system;
    }

    getModule(sys_id:string, id : string){
        var system = this.get(sys_id);
        var module = system.get(id);
    }

}
