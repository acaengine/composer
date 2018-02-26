/*
* @Author: Alex Sorafumo
* @Date:   2017-05-12 14:08:53
 * @Last Modified by: Alex Sorafumo
 * @Last Modified time: 2017-12-15 09:30:32
*/

import { Injectable } from '@angular/core';

import { COMPOSER } from '../settings';
import { CommsService } from './auth/comms.service';
import { SystemsService } from './systems/systems.service';
import { ResourcesService } from './resources/resources.service';

@Injectable()
export class ComposerDebugService {
    public services: any = {};

    constructor(private systems: SystemsService, private resources: ResourcesService, private comms: CommsService) {
        this.services.systems = systems;
        this.services.resources = resources;
        this.services.comms = comms;
        COMPOSER.log('DEBUG', 'Injected');
        let win = self as any;
        if (!win.$aca) { win.$aca = {}; }
        win.$aca.composer = this;
    }

    public cmd(cmd: string, data?: any): any {
        if (COMPOSER.get('debug')) {
            switch (cmd.toLowerCase()) {
                case 'help':
                    this.help();
                    break;
                case 'service':
                    COMPOSER.log('DEBUG', `Running command 'service'...`);
                    if (typeof data === 'string') {
                        return this.services[data.toLowerCase()];
                    }
                    break;
                case 'bindings':
                    return this.bindings(data);
                case 'exec':
                    return this.exec(data);
                default:
                    COMPOSER.log('DEBUG', `Unknown command '${cmd}'. Use 'help' to get a list of commands.`);
                    break;
            }
        } else {
            COMPOSER.error('DEBUG', 'Debug mode is disabled.');
        }
        return {};
    }

    public bindings(sys: string) {
        if (COMPOSER.get('debug')) {
            COMPOSER.log('DEBUG', `Running command 'bindings'...`);
        } else {
            COMPOSER.error('DEBUG', 'Debug mode is disabled.');
        }
    }

    public exec(options: any) {
        if (COMPOSER.get('debug')) {
            COMPOSER.log('DEBUG', `Running command 'exec'...`);
        } else {
            COMPOSER.error('DEBUG', 'Debug mode is disabled.');
        }
    }

    public help() {
        if (COMPOSER.get('debug')) {
            COMPOSER.log('DEBUG', 'Running command help...');
            COMPOSER.log('DEBUG', `
    Available commands:
        help     - Lists the available commands for composer debug.
        service  - Returns given service. Available services: Comms, Resources, Store, Systems.
        bindings - Lists the bindings on the given system.
        exec     - Executes a function on the given system.`);
        } else {
            COMPOSER.error('DEBUG', 'Debug mode is disabled.');
        }
    }
}
