/*
 * @Author: Alex Sorafumo
 * @Date:   2017-03-21 16:57:15
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-03 16:14:21
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { COMPOSER } from '../../../settings';

import { MockModule, MockSystem, MockUser, MockZone, MODULE_LIST, SYSTEM_LIST, ZONE_LIST } from './classes';
import { MOCK_REQ_HANDLER } from './request-handler.mock';
import { MockRequest } from './request.mock';

@Injectable({
    providedIn: 'root'
})
export class MockHttp {

    public type = 'MockHttp';

    public get(url: string, options: any) {
        COMPOSER.log(`HTTP(M)`, `GET Request made to url "${url}"`);
        return new MockRequest('GET', url, null, options);
    }

    public post(url: string, data: any, options: any) {
        COMPOSER.log(`HTTP(M)`, `POST Request made to url "${url}"`, data);
        return new MockRequest('POST', url, data, options);
    }

    public put(url: string, data: any, options: any) {
        COMPOSER.log(`HTTP(M)`, `PUT Request made to url "${url}"`, data);
        return new MockRequest('PUT', url, data, options);
    }

    public delete(url: string, options: any) {
        COMPOSER.log(`HTTP(M)`, `DELETE Request made to url "${url}"`);
        return new MockRequest('DELETE', url, null, options);
    }
}

export let initialiseMockClasses = () => {
    COMPOSER.log('SYSTEM', 'Initialising mock data.');
    // Add mock modules to the system
    const mod_cnt = Math.floor(Math.random() * 20 + 2);
    for (let i = 0; i < mod_cnt; i++) {
        const module = new MockModule();
        MODULE_LIST.push(module);
    }
    MOCK_REQ_HANDLER.register('/control/api/modules', { total: MODULE_LIST.length, results: MODULE_LIST });
    MOCK_REQ_HANDLER.register(`/control/api/module/:mod_id`, MODULE_LIST, (event) => {
        const modules = event.data;
        const id: string = event.params.mod_id;
        if (id) {
            for (const mod of modules) {
                if (mod.id === id) {
                    return mod;
                }
            }
        } else {
            return {};
        }
    });
    // Add mock zones to the system
    const zone_cnt = Math.floor(Math.random() * 20 + 2);
    for (let i = 0; i < zone_cnt; i++) {
        const zone = new MockZone();
        ZONE_LIST.push(zone);
    }
    MOCK_REQ_HANDLER.register('/control/api/zones', { total: ZONE_LIST.length, results: ZONE_LIST });
    MOCK_REQ_HANDLER.register(`/control/api/zone/:zone_id`, ZONE_LIST, (event) => {
        const zones = event.data;
        const id: string = event.params.zone_id;
        if (id) {
            for (const zone of zones) {
                if (zone.id === id) {
                    return zone;
                }
            }
        } else {
            return {};
        }
    });
    // Add mock systems to the system
    const win = self as any;
    if (win && win.control && win.control.systems) {
        const systems: any = win.control.systems;
        for (const i in systems) {
            if (i) {
                SYSTEM_LIST.push(new MockSystem(i, systems[i]));
            }
        }
    } else {
        const sys_cnt = Math.floor(Math.random() * 50 + 10);
        for (let i = 0; i < sys_cnt; i++) {
            const system = new MockSystem();
            SYSTEM_LIST.push(system);
        }
    }
    MOCK_REQ_HANDLER.register(`/control/api/system/:sys_id`, SYSTEM_LIST, (event) => {
        const systems = event.data;
        const id: string = event.params.sys_id;
        if (id) {
            for (const sys of systems) {
                if (sys.id === id) {
                    return sys;
                }
            }
        } else {
            return {};
        }
    });

    MOCK_REQ_HANDLER.register('/control/api/systems', { total: SYSTEM_LIST.length, results: SYSTEM_LIST });
    // Add mock user to the system
    MOCK_REQ_HANDLER.register('/control/api/user/current', new MockUser());
};

setTimeout(() => {
    initialiseMockClasses();
}, 10);
