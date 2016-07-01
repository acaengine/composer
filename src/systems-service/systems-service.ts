
import { Injectable } from '@angular/core';
import { System } from './classes'
//import { Web_Socket } from '../websocket/websocket';
import { WebSocket } from '../websocket/index';

@Injectable()
export class  SystemsService {
    systems: System[] = [];
    bound_systems: System[] = [];
    io: WebSocket;
    connected = false;
    request_id = 0;

    constructor() {
        let host = 'localhost';
        let port = '443';
        // let uri = 'wss://' + host + ':' + port;
        this.io = new WebSocket(this, host, port);
    }

    get(sys_id: string) {
        let system: any = null;
        //Check if system already exists
        for(let i = 0; this.systems && i < this.systems.length; i++) {
            if(this.systems[i].id == sys_id) {
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

    getModule(sys_id:string, id: string) {
        let system = this.get(sys_id);
        let module = system.get(id);
        return module;
    }

}
