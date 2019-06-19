/*
* @Author: Alex Sorafumo
* @Date:   2017-05-12 14:08:53
 * @Last Modified by: Alex Sorafumo
 * @Last Modified time: 2017-12-15 09:30:32
*/

import { Injectable } from '@angular/core';

import { log, error } from '../settings';
import { CommsService } from './auth/comms.service';
import { SystemsService } from './systems/systems.service';
import { ResourcesService } from './resources/resources.service';

@Injectable({
    providedIn: 'root'
})
export class ComposerDebugService {
    public services: any = {};

    constructor(private systems: SystemsService, private resources: ResourcesService, private comms: CommsService) {
        this.services.systems = systems;
        this.services.resources = resources;
        this.services.comms = comms;
        log('DEBUG', 'Injected');
        let win = self as any;
        if (!win.$aca) { win.$aca = {}; }
        win.$aca.composer = this;
    }
    /**
     * Run given command
     * @param cmd Name of the command
     * @param data Data to pass command
     */
    public cmd(cmd: string, data?: any): any {
        if (window.debug) {
            switch (cmd.toLowerCase()) {
                case 'help':
                    this.help();
                    break;
                case 'service':
                    log('DEBUG', `Running command 'service'...`);
                    if (typeof data === 'string') {
                        return this.services[data.toLowerCase()];
                    }
                    break;
                case 'bindings':
                    return this.bindings(data);
                case 'exec':
                    return this.exec(data);
                default:
                    log('DEBUG', `Unknown command '${cmd}'. Use 'help' to get a list of commands.`);
                    break;
            }
        } else {
            error('DEBUG', 'Debug mode is disabled.');
        }
        return {};
    }

    public bindings(sys: string) {
        if (window.debug) {
            log('DEBUG', `Running command 'bindings'...`);
        } else {
            error('DEBUG', 'Debug mode is disabled.');
        }
    }

    public exec(options: any) {
        if (window.debug) {
            log('DEBUG', `Running command 'exec'...`);
        } else {
            error('DEBUG', 'Debug mode is disabled.');
        }
    }

    public help() {
        if (window.debug) {
            log('DEBUG', 'Running command help...');
            log('DEBUG', `
    Available commands:
        help     - Lists the available commands for composer debug.
        service  - Returns given service. Available services: Comms, Resources, Store, Systems.
        bindings - Lists the bindings on the given system.
        exec     - Executes a function on the given system.`);
        } else {
            error('DEBUG', 'Debug mode is disabled.');
        }
    }
}
