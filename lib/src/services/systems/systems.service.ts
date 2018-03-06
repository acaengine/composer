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
import { System } from './classes/system.class';

import { DataStoreService } from '../data-store.service';
import { ResourcesService } from '../resources/resources.service';
import { $WebSocket } from '../websocket';
import { $WebSocketMock } from '../websocket.mock';

import { COMPOSER } from '../../settings';

@Injectable()
export class SystemsService {
    public is_setup: boolean = false;
    private systems: System[] = [];
    private bound_systems: System[] = [];
    private io: any;
    private connected = false;
    private request_id = 0;
    private mock: boolean = false;
    private fixed_device: boolean = false;
    private sub: any = null;
    private system_promises: any = {};
    private system_exists: any = {};

    constructor(private r: ResourcesService, private route: ActivatedRoute, private store: DataStoreService) {
        store.local.getItem(`fixed_device`).then((value: string) => {
            this.fixed_device = (value === 'true');
        });

        this.sub = this.route.queryParams.subscribe((params: any) => {
            this.fixed_device = params.fixed_device === 'true' ? params.fixed_device === 'true' : this.fixed_device;
            store.local.setItem('fixed_device', this.fixed_device ? 'true' : 'false');
        });
        // setInterval(() => this.updateSystems(), 60 * 1000);
    }

    /**
     * Get the resources service
     * @return  Returns the resources service
     */
    get resources() {
        return this.r;
    }

    /**
     * Sets up the websocket and resources service with the given options
     * @param options Options to pass to websocket and resources service
     * @return  Returns the success of the initialisation of the resouces service
     */
    public setup(options: any): any {
         COMPOSER.loadSettings();
         this.mock = options.mock ? true : false;
         this.is_setup = true;
         const o = options;
         if (this.r) {
             this.r.setup(options);
         }
         const host = o.host ? o.host : location.hostname;
         const port = o.port ? o.port : location.port;
         const prot = o.protocol ? o.protocol : location.protocol;
         if (options.mock) {
             COMPOSER.log('Systems', 'Setting up mock websocket.');
             if (this.io) {
                 delete this.io;
             }
             this.io = new $WebSocketMock(this, this.r, this.fixed_device);
             this.io.setup(this.r, host, port, prot);
             return this.r.init(options.api_endpoint, true).then(() => true, (err) => false);
         } else {
             COMPOSER.log('Systems', 'Setting up websocket.');
             if (!this.io) {
                 this.io = new $WebSocket(this, this.r, this.fixed_device);
             }
             this.io.setup(this.r, host, port, prot);
             return this.r.init(o.api_endpoint).then(() => true, (err) => false);
         }
    }

    /**
     * Get a system with the given id, creates a new system if it doesn't exist
     * @param sys_id System ID
     * @return  Returns the system with the given id
     */
    public get(sys_id: string) {
        this.updateSystems();
        const system = this.r.get('System');
        if (!this.mock) {
            if (!this.system_promises[sys_id] && system) {
                this.system_promises[sys_id] = new Promise((resolve) => {
                    if (this.system_exists[sys_id]) {
                        const s = this.getSystem(sys_id);
                        s.exists = true;
                        this.system_promises[sys_id] = null;
                        resolve();
                    } else {
                        system.get({ id: sys_id }).then((check_sys: any) => {
                            this.system_exists[sys_id] = true;
                            const s = this.getSystem(sys_id);
                            s.exists = true;
                            this.system_promises[sys_id] = null;
                            resolve();
                        }, (err: any) => {
                            this.system_exists[sys_id] = false;
                            const sys = this.getSystem(sys_id);
                            sys.exists = false;
                            this.system_promises[sys_id] = null;
                            resolve();
                        });
                    }
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
     * @param i      Index of module in system
     * @return     Returns module if found
     */
    public getModule(sys_id: string, id: string, i: number = 1) {
        const system = this.get(sys_id);
        const module = system.get(id, i);
        return module;
    }

    /**
     * Check the state of the websocket
     * @return  [description]
     */
    public isConnected() {
        return this.io ? this.io.connected : false;
    }

    /**
     * Rebinds all the bindings in each system
     * @return
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
    * @return
    */
    public exec(sys_id: string, mod_id: string, i: number, fn: string, args: Array<any>) {
        if (this.io && this.io.connected) {
            return this.io.exec(sys_id, mod_id, i, fn, args);
        } else {
            throw `execute failed as websocket not online\n${sys_id}: ${mod_id}_${i}.${fn}(${args.join(",")})`;
        }
    }

    /**
     * Get a system with the given id, creates a new system if it doesn't exist
     * @param sys_id System ID
     * @return  Returns the system with the given id
     */
    private getSystem(sys_id: string) {
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
            system = new System(this, sys_id);
            this.systems.push(system);
        }
        return system;
    }

    /**
     * Checks if each system stored exists on the server
     * @return
     */
    private updateSystems(): any {
        if (this.r && this.io) {
            for (let i = 0; this.systems && i < this.systems.length; i++) {
                const system = this.systems[i];
                if (!system.exists) {
                    const sys = this.r.get('System');
                    if (sys) {
                        const mod = sys.get({ id: system.id });
                        if (mod) {
                            mod.then((check_sys: any) => system.exists = true, (err: any) => false);
                        }
                    }
                }
            }
        }
    }
}
