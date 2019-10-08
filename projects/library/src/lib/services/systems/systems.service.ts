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

import { DataStoreService } from '../data-store.service';
import { ResourcesService } from '../resources/resources.service';
import { $WebSocket } from '../websocket';
import { $WebSocketMock } from '../websocket.mock';

import { log } from '../../settings';

import { EngineSystem } from './classes/system.class';
import { EngineModule } from './classes/module.class';
import { Subscription } from 'rxjs';
import { OAuthService } from '../auth/oauth2.service';

@Injectable({
    providedIn: 'root'
})
export class SystemsService {
    public is_setup: boolean = false;
    private systems: EngineSystem[] = [];
    private io: any;
    private mock: boolean = false;
    private sub: Subscription;
    private fixed_device: boolean = false;
    private system_promises: { [name: string]: Promise<any> } = {};
    protected model: { [name: string]: any } = {};

    constructor(private r: ResourcesService, private route: ActivatedRoute, private store: DataStoreService, private auth: OAuthService) {
        this.store.local.getItem(`fixed_device`).then((value: string) => {
            this.fixed_device = (value === 'true');
        });
            // Listen for query parameter fixed device
        this.sub = this.route.queryParamMap.subscribe((params: any) => {
            if (params.has('fixed_device')) {
                this.fixed_device = params.get('fixed_device') === 'true' || this.fixed_device;
                if (this.fixed_device) {
                    store.local.setItem(`${this.model.client_id ? this.model.client_id  + '.' : '' }fixed_device`, 'true');
                }
            }
        });
        // setInterval(() => this.updateSystems(), 60 * 1000);
    }

    /**
     * Get the resources service
     * @return  Returns the resources service
     */
    get resources(): ResourcesService {
        return this.r;
    }

    /**
     * Sets up the websocket and resources service with the given options
     * @param options Options to pass to websocket and resources service
     * @return  Returns the success of the initialisation of the resouces service
     */
    public setup(options: any): any {
         this.mock = options.mock ? true : false;
         this.is_setup = true;
         const o = options;
         if (this.r) {
             this.r.setup(options);
         }
            // Update store value for fixed device
         this.model.client_id = this.r.http.hash(o.redirect_uri);
         if (this.model.client_id) {
            this.store.local.getItem(`${this.model.client_id}_fixed_device`).then((state) => this.fixed_device = state === 'true');
            if (this.fixed_device) {
                this.store.local.setItem(`${this.model.client_id}_fixed_device`, 'true');
             }
         }
            // Setup websocket
         const host = o.host ? o.host : location.hostname;
         const port = o.port ? o.port : location.port;
         const prot = o.protocol ? o.protocol : location.protocol;
         if (options.mock) {
                // Running mock data
             log('Systems', 'Setting up mock websocket.');
             if (this.io) {
                 delete this.io;
             }
             this.io = new $WebSocketMock(this, this.r, this.fixed_device);
             this.io.setup(this.r, host, port, prot);
             return this.r.init(options.api_endpoint, true).then(() => true, (err) => false);
         } else {
                // Running live data
             log('Systems', 'Setting up websocket.');
             if (!this.io) {
                 this.io = new $WebSocket(this, this.auth, this.fixed_device);
             }
             this.io.setup(this.auth, host, port, prot);
             return this.r.init(o.api_endpoint).then(() => true, (err) => false);
         }
    }

    /**
     * Get a system with the given id, creates a new system if it doesn't exist
     * @param sys_id System ID
     * @return  Returns the system with the given id
     */
    public get(sys_id: string): EngineSystem {
        this.updateSystems();
        const system = this.r.get('System');
        if (!this.mock) {
            if (!this.system_promises[sys_id] && system) {
                this.system_promises[sys_id] = new Promise((resolve) => {
                    const s = this.getSystem(sys_id);
                    // s.exists = true;
                    this.system_promises[sys_id] = null;
                    resolve();
                });
            }
        }
        // Check that the system exists and update it's status then return it to be used.
        return this.getSystem(sys_id);
    }

    /**
     * Gets a module from the
     * @param sys_id System ID
     * @param id     Module name
     * @param i      Index of module
     * @return Matched module or null
     */
    public getModule(sys_id: string, id: string, i: number = 1): EngineModule {
        const system = this.get(sys_id);
        const mod = system.get(id, i);
        return mod;
    }

    /**
     * Check the state of the websocket
     * @return State of the websocket
     */
    public isConnected(): boolean {
        return this.io ? this.io.connected : false;
    }

    /**
     * Rebinds all the bindings in each system
     */
    public rebind() {
        for (let i = 0; this.systems && i < this.systems.length; i++) {
            if (this.systems[i]) {
                this.systems[i].rebind();
            }
        }
    }

    /**
     * Executes a command over the websocket connection
     * @param sys_id ID of the system
     * @param mod_id ID of the module
     * @param i Index of the module
     * @param fn Name of the command to excute
     * @param args Parameters to pass to method that is being executed
     */
    public exec(sys_id: string, mod_id: string, i: number, fn: string, args: Array<any>) {
        if (this.io && this.io.connected) {
            return this.io.exec(sys_id, mod_id, i, fn, args);
        } else {
            throw `Execute failed as websocket not online\n${sys_id}: ${mod_id}_${i}.${fn}(${args.join(",")})`;
        }
    }

    /**
     * Get a system with the given id, creates a new system if it doesn't exist
     * @param sys_id System ID
     * @return  Matched system or null
     */
    private getSystem(sys_id: string): EngineSystem {
        this.updateSystems();
        let system: any = null;
        // Check if system already exists
        for (let i = 0; this.systems && i < this.systems.length; i++) {
            if (this.systems[i].id === sys_id) {
                system = this.systems[i];
            }
        }
        if (system === null) {
            // System not stored create new one.
            system = new EngineSystem(this, sys_id);
            this.systems.push(system);
        }
        return system;
    }

    /**
     * Checks if each system stored exists on the server
     */
    private updateSystems(check: boolean = false) {
        if (this.r && this.io) {
            for (let i = 0; this.systems && i < this.systems.length; i++) {
                const system = this.systems[i];
                if (check && !system.exists) {
                    const sys = this.r.get('System');
                    if (sys) {
                        const mod = (sys as any).get({ id: system.id });
                        if (mod) {
                            mod.then((check_sys: any) => system.exists = true, (err: any) => false);
                        }
                    }
                }
            }
        }
    }
}
