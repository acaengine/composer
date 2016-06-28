import { Injectable } from 'angular2/core';
import { System } from './classes'
//import { Web_Socket } from '../websocket/websocket';
import { Web_Socket } from '../websocket/mocksocket';

@Injectable()
export class  SystemsService {
    systems : System[] = [];
    io : Web_Socket;
    connected = false;
    request_id = 0;

    constructor(host : string = 'localhost', port : string = '443'){
        var uri = 'wss://' + host + ':' + port;
        this.io = new Web_Socket(this, host, port);
    }

    get(sys_id : string){
        var system = null;
        //Check if system already exists
        for(var i = 0; this.systems && i < this.systems.length; i++){
            if(this.systems[i].id == sys_id){
                system = this.systems[i];
            }
        }
        if(system === null) {
            //System not stored create new one.
            system = new System(this, sys_id);
            this.systems.push(system);
        }
        return system;
    }

    getModule(sys_id:string, id : string){
        var system = this.get(sys_id);
        var module = system.get(id);
    }

}
