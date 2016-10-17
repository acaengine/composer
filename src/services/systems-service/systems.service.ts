
import { Injectable } from '@angular/core';
import { System } from './classes'
//import { Web_Socket } from '../websocket/websocket';
import { $WebSocket } from '../websocket';
import { Resources } from '../resources.service';

@Injectable()
export class SystemsService {
    systems: System[] = [];
    bound_systems: System[] = [];
    io: any;
    connected = false;
    request_id = 0;
    //private r: any;

    constructor(private r: Resources) {
    	//*
        let auth: any = null;
        if(r) auth = r;
        this.io = new $WebSocket(this, auth);
        //*/
        //*
        setInterval(() => {
            this.updateSystems();
        }, 60 * 1000);
        /*
        /this.r.init(this.io.end_point.replace('ws', 'http') + '/control/');
        //*/
    }

    get resources() {
    	return this.r;
    }

    setSocket(ws: any) {
        this.io = ws;
        this.io.serv = this;
        this.r.init(this.io.end_point.replace('ws', 'http') + '/control/');
    }

    newSocket(url: string, port: string = '3000'){
    		//Clean old websockets
    	if(this.io) {

    	}
        this.r.init((port === '443' ? 'https' : 'http') + '://' + url + '/control/').then(() => {
        	this.io = new $WebSocket(this, this.r, url, port);
        }, (err: any) => {});
    }

    setup(options: any) {
        this.io.setup(this.r, options.host ? options.host : location.hostname , options.port ? options.port : 3000);
        this.r.setup(options);
        return this.r.init().then(() => { return true; }, (err) => { return false; });
    }

    get(sys_id: string) {
        let system = this.r.get('System');
        system.get({id: sys_id}).then((sys: any) => {
            let s = this.getSystem(sys_id);
            s.exists = true;
        }, (err: any) => {
            let sys = this.getSystem(sys_id);
            sys.exists = false;
        });
            //Check that the system exists and update it's status then return it to be used.
        return this.getSystem(sys_id);
    }

    private updateSystems(){
    	if(this.r && this.io) {
	        for(let i = 0; this.systems && i < this.systems.length; i++) {
	            let system = this.systems[i];
	            if(!system.exists){
	                let sys = this.r.get('System');
	                return sys.get({id: system.id}).then((sys: any) => {
	                    system.exists = true;
	                }, (err: any) => {});
	            }
	        }
	    }
    }

    private getSystem(sys_id: string){
        let system: any = null;
        // Check if system already exists
        for(let i = 0; this.systems && i < this.systems.length; i++) {
            if(this.systems[i].id == sys_id) {
                system = this.systems[i];
            }
        }
        if(system === null) {
            // System not stored create new one.
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

    isConnected() {
        return this.io ? this.io.connected : false;
    }

    rebind(){
        for(let i = 0; this.systems && i < this.systems.length; i++) {
            this.systems[i].rebind();
        }
    }

}
