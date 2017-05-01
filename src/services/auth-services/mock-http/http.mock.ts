/*
 * @Author: Alex Sorafumo
 * @Date:   2017-03-21 16:57:15
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-01 16:42:08
 */

 import { Injectable } from '@angular/core';
 import { Observable } from 'rxjs/Observable';

 import { COMPOSER } from '../../../settings';

 import { MockModule, MockSystem, MockUser, MockZone, MODULE_LIST, SYSTEM_LIST, ZONE_LIST } from './classes';
 import { MOCK_REQ_HANDLER } from './request-handler.mock';
 import { MockRequest } from './request.mock';

 @Injectable()
 export class MockHttp {

     constructor() {
         setTimeout(() => {
             initialiseMockClasses();
         }, 200);
     }

     public get(url: string, options: any) {
         COMPOSER.log(`HTTP(M)`, `GET Request made to url "${url}"`);
         return new MockRequest('GET', url, null, options);
     }

     public post(url: string, options: any) {
         COMPOSER.log(`HTTP(M)`, `GET Request made to url "${url}"`);
         return new MockRequest('POST', url, null, options);
     }

     public put(url: string, data: any, options: any) {
         COMPOSER.log(`HTTP(M)`, `GET Request made to url "${url}"`);
         return new MockRequest('PUT', url, null, options);
     }

     public delete(url: string, options: any) {
         COMPOSER.log(`HTTP(M)`, `GET Request made to url "${url}"`);
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
         MOCK_REQ_HANDLER.register(`/control/api/module/${module.id}`, module);
     }
     MOCK_REQ_HANDLER.register('/control/api/modules', MODULE_LIST);
     // Add mock zones to the system
     const zone_cnt = Math.floor(Math.random() * 20 + 2);
     for (let i = 0; i < zone_cnt; i++) {
         const zone = new MockZone();
         ZONE_LIST.push(zone);
         MOCK_REQ_HANDLER.register(`/control/api/zone/${zone.id}`, zone);
     }
     MOCK_REQ_HANDLER.register('/control/api/zones', ZONE_LIST);
     // Add mock systems to the system
     if (self && self.control && self.control.systems) {
         const systems: any = self.control.systems;
         for (const i in systems) {
             if(i){
                  SYSTEM_LIST.push(new MockSystem(i, systems[i]));
              }
         }
     } else {
         const sys_cnt = Math.floor(Math.random() * 50 + 10);
         for (const i = 0; i < sys_cnt; i++) {
             const system = new MockSystem();
             SYSTEM_LIST.push(system);
             MOCK_REQ_HANDLER.register(`/control/api/system/${system.id}`, system);
         }
     }
     MOCK_REQ_HANDLER.register('/control/api/systems', SYSTEM_LIST);
     // Add mock user to the system
     MOCK_REQ_HANDLER.register('/control/api/user/current', new MockUser());
 };
