/**
* @Author: Alex Sorafumo
* @Date:   19/10/2016 10:47 AM
* @Email:  alex@yuion.net
* @Filename: systems.service.ts
* @Last modified by:   alex.sorafumo
* @Last modified time: 17/01/2017 2:47 PM
*/

import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { System } from './classes'
//import { Web_Socket } from '../websocket/websocket';
import { $WebSocket } from '../websocket';
import { $WebSocketMock } from '../websocket.mock';
import { Resources } from '../resources.service';

@Injectable()
export class SystemsService {
    systems: System[] = [];
    bound_systems: System[] = [];
    io: any;
    connected = false;
    request_id = 0;
    mock: boolean = false;
    fixed_device: boolean = false;
    sub: any = null;
    is_setup: boolean = false;
    //private r: any;

    constructor(private r: Resources, private route: ActivatedRoute) {
        if(sessionStorage) {
            this.fixed_device = (sessionStorage.getItem(`fixed_device`) === 'true');
        }
        //*
        this.sub = this.route.queryParams.subscribe( (params: any) => {
            this.fixed_device = params['fixed_device'] === 'true' ? params['fixed_device'] === 'true' : this.fixed_device;
            if(sessionStorage) {
                sessionStorage.setItem(`fixed_device`, this.fixed_device ? 'true': 'false');
            }
        });
    	//*
        let auth: any = null;
        if(r) auth = r;
        this.io = new $WebSocket(this, auth, this.fixed_device);
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
        	this.io = new $WebSocket(this, this.r, this.fixed_device, url, port);
        }, (err: any) => {});
    }

    setup(options: any): any {
        this.mock = options.mock ? true : false;
        this.is_setup = true;
        if(options.mock){
            if(window['debug']) console.debug('[COMPOSER][Systems] Setting up mock websocket.');
            if(this.io) delete this.io;
            this.io = new $WebSocketMock(this, this.r, this.fixed_device);
            this.io.setup(this.r, options.host ? options.host : location.hostname , options.port ? options.port : 3000);
            if(options.http) {
                return this.r.init(options.api_endpoint).then(() => { return true; }, (err) => { return false; });
            } else return true;
        } else {
            if(window['debug']) console.debug('[COMPOSER][Systems] Setting up websocket.');
            this.io.setup(this.r, options.host ? options.host : location.hostname , options.port ? options.port : 3000);
            return this.r.init(options.api_endpoint).then(() => { return true; }, (err) => { return false; });
        }
        //this.r.setup(options);
    }

    get(sys_id: string) {
        let system = this.r.get('System');
        if(!this.mock) {
            system.get({id: sys_id}).then((sys: any) => {
                let s = this.getSystem(sys_id);
                s.exists = true;
            }, (err: any) => {
                let sys = this.getSystem(sys_id);
                sys.exists = false;
            });
        }
            //Check that the system exists and update it's status then return it to be used.
        return this.getSystem(sys_id);
    }

    private updateSystems(): any{
    	if(this.r && this.io) {
	        for(let i = 0; this.systems && i < this.systems.length; i++) {
	            let system = this.systems[i];
	            if(!system.exists){
	                let sys = this.r.get('System');
                    if(sys){
                        let mod = sys.get({id: system.id});
                        console.log(mod);
                        if(mod) {
                            return mod.then((sys: any) => {
                                system.exists = true;
                            }, (err: any) => {});
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
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
