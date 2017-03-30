/**
* @Author: Alex Sorafumo
* @Date:   19/10/2016 10:47 AM
* @Email:  alex@yuion.net
* @Filename: systems.service.ts
* @Last modified by:   Alex Sorafumo
* @Last modified time: 30/01/2017 1:14 PM
*/

import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { System } from './classes'
//import { Web_Socket } from '../websocket/websocket';
import { $WebSocket } from '../websocket';
import { $WebSocketMock } from '../websocket.mock';
import { Resources } from '../resources.service';
import { DataStoreService } from '../data-store.service';

import { COMPOSER_SETTINGS } from '../../settings';

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
    system_promises: any = {};
    //private r: any;

    constructor(private r: Resources, private route: ActivatedRoute, private store: DataStoreService) {
    	store.local.getItem(`fixed_device`).then((value) => {
    		this.fixed_device = (value === 'true');
    	});
        //*
        this.sub = this.route.queryParams.subscribe( (params: any) => {
            this.fixed_device = params['fixed_device'] === 'true' ? params['fixed_device'] === 'true' : this.fixed_device;
            store.local.setItem('fixed_device', this.fixed_device ? 'true': 'false');
        });
    	//*
        let auth: any = null;
        if(r) auth = r;
        //this.io = new $WebSocket(this, auth, this.fixed_device);
        //*/
        //*
        setInterval(() => {
            this.updateSystems();
        }, 60 * 1000);
        /*
        /this.r.init(this.io.end_point.replace('ws', 'http') + '/control/');
        //*/
    }

    /**
     * Get the resources service
     * @return {Resources} Returns the resources service
     */
    get resources() {
    	return this.r;
    }

    /**
     * Sets up the websocket and resources service with the given options
     * @param  {any} options Options to pass to websocket and resources service
     * @return {boolean} Returns the success of the initialisation of the resouces service
     */
    setup(options: any): any {
    	COMPOSER_SETTINGS.loadSettings();
        this.mock = options.mock ? true : false;
        this.is_setup = true;
        let o = options;
        if(this.r) this.r.setup(options);
        if(options.mock){
            if(COMPOSER_SETTINGS.get('debug')) console.debug('[COMPOSER][Systems] Setting up mock websocket.');
            if(this.io) delete this.io;
            this.io = new $WebSocketMock(this, this.r, this.fixed_device);
            this.io.setup(this.r, o.host ? o.host : location.hostname , o.port ? o.port : location.port, o.protocol ? o.protocol : location.protocol);
            return this.r.init(options.api_endpoint, true).then(() => { return true; }, (err) => { return false; });
        } else {
            if(COMPOSER_SETTINGS.get('debug')) console.debug('[COMPOSER][Systems] Setting up websocket.');
            if(!this.io) this.io = new $WebSocket(this, this.r, this.fixed_device);
            this.io.setup(this.r, o.host ? o.host : location.hostname , o.port ? o.port : location.port, o.protocol ? o.protocol : location.protocol);
            return this.r.init(o.api_endpoint).then(() => { return true; }, (err) => { return false; });
        }
    }
    /**
     * Get a system with the given id, creates a new system if it doesn't exist
     * @param  {string} sys_id System ID
     * @return {any} Returns the system with the given id
     */
    get(sys_id: string) {
        let system = this.r.get('System');
        if(!this.mock) {
            if(!this.system_promises[sys_id] && system) {
                this.system_promises[sys_id] = new Promise((resolve, reject) => {
                    system.get({id: sys_id}).then((sys: any) => {
                        let s = this.getSystem(sys_id);
                        s.exists = true;
                        this.system_promises[sys_id] = null;
                        resolve();
                    }, (err: any) => {
                        let sys = this.getSystem(sys_id);
                        sys.exists = false;
                        this.system_promises[sys_id] = null
                        resolve();
                    });
                });
            }
        }
            //Check that the system exists and update it's status then return it to be used.
        return this.getSystem(sys_id);
    }

    /**
     * Checks if each system stored exists on the server
     * @return {void}
     */
    private updateSystems(): any{
    	if(this.r && this.io) {
	        for(let i = 0; this.systems && i < this.systems.length; i++) {
	            let system = this.systems[i];
	            if(!system.exists){
	                let sys = this.r.get('System');
                    if(sys){
                        let mod = sys.get({id: system.id});
                        if(mod) {
                            mod.then((sys: any) => {
                                system.exists = true;
                            }, (err: any) => {});
                        }
                    }
                }
	        }
	    }
    }

    /**
     * Get a system with the given id, creates a new system if it doesn't exist
     * @param  {string} sys_id System ID
     * @return {any} Returns the system with the given id
     */
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
    /**
     * Gets a module from the
     * @param  {string} sys_id System ID
     * @param  {string} id     Module name
     * @param  {number = 1} i      Index of module in system
     * @return {any}    Returns module if found
     */
    getModule(sys_id:string, id: string, i:number = 1) {
        let system = this.get(sys_id);
        let module = system.get(id, i);
        return module;
    }

    /**
     * Check the state of the websocket
     * @return {[type]} [description]
     */
    isConnected() {
        return this.io ? this.io.connected : false;
    }

    /**
     * Rebinds all the bindings in each system
     * @return {void}
     */
    rebind(){
        for(let i = 0; this.systems && i < this.systems.length; i++) {
            this.systems[i].rebind();
        }
    }

}
