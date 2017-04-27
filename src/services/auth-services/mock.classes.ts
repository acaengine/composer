/*
* @Author: Alex Sorafumo
* @Date:   2017-03-23 10:01:25
* @Last Modified by:   Alex Sorafumo
* @Last Modified time: 2017-04-06 10:26:19
*/

import { MOCK_REQ_HANDLER } from './http.mock';
import * as faker from 'faker';

let ZONE_LIST: any[] = [];

const CHAR_LIST = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV';

export class MockClass {
	id: string = ''
	name: string = '';
	constructor() {
		this.name = faker.commerce.department() + ' ' + faker.company.bsNoun();
	}

	gen_id(prefix: string, cnt: number) {
		let id = '';
		while(cnt > 0) {
			id = CHAR_LIST[cnt % CHAR_LIST.length] + id;
			cnt = Math.floor(cnt / CHAR_LIST.length);
		}
		this.id = prefix + id;
	}

	match(value: any, field?: string) {

	}

	update(data: any) {

	}
}

export class MockZone extends MockClass {
	static COUNT: number = 0;
	constructor() {
		super();
		this.gen_id('zone_Fd-', ++MockZone.COUNT);
	}
}

let SYSTEM_LIST: any[] = [];

export class MockSystem extends MockClass {
	static COUNT: number = 0;
	constructor(id?:string, data?:any) {
		super();
		if(!id){
			this.gen_id('sys_Fd-', ++MockSystem.COUNT);
		} else {
			this.id = id;
			if(data) {
				if(data && data.System && data.System[0] && data.System[0].name) {
					this.name = data.System[0].name;
				}
				for(let i in data) {
					if(data[i] && !(this[i] instanceof Function)){
						this[i] = data[i];
					}
				}
			}
		}

	}

}

let MODULE_LIST: any[] = [];

export class MockModule extends MockClass {
	static COUNT: number = 0;
	constructor() {
		super();
		this.gen_id('mod_Fd-', ++MockModule.COUNT);

	}

}

export class MockUser extends MockClass {
	name: string;
	email: string;
	constructor() {
		super();
		let gender = Math.floor(Math.random() * 100000) % 2;
		this.name = faker.name.firstName(gender) + ' ' + faker.name.lastName(gender);
		this.email = this.name.split(' ').join('.').toLowerCase() + '@' + faker.internet.domainName();
	}
}


export let initialiseMockClasses = () => {
	console.debug('[COMPOSER][SYSTEM] Initialising mock data.');
		// Add mock modules to the system
	let mod_cnt = Math.floor(Math.random() * 20 + 2);
	for(let i = 0; i < mod_cnt; i++){
		let module = new MockModule();
		MODULE_LIST.push(module);
		MOCK_REQ_HANDLER.register(`/control/api/module/${module.id}`, module);
	}
	MOCK_REQ_HANDLER.register('/control/api/modules', MODULE_LIST);
		// Add mock zones to the system
	let zone_cnt = Math.floor(Math.random() * 20 + 2);
	for(let i = 0; i < zone_cnt; i++){
		let zone = new MockZone();
		ZONE_LIST.push(zone);
		MOCK_REQ_HANDLER.register(`/control/api/zone/${zone.id}`, zone);
	}
	MOCK_REQ_HANDLER.register('/control/api/zones', ZONE_LIST);
		// Add mock systems to the system
	console.log(self['control']);
	if(self && self['control'] && self['control']['systems']) {
		let systems = self['control']['systems'];
		for(let i in systems) {
			SYSTEM_LIST.push(new MockSystem(i, systems[i]));
		}
	} else {
		let sys_cnt = Math.floor(Math.random() * 50 + 10);
		for(let i = 0; i < sys_cnt; i++){
			let system = new MockSystem();
			SYSTEM_LIST.push(system);
			MOCK_REQ_HANDLER.register(`/control/api/system/${system.id}`, system);
		}
	}
	MOCK_REQ_HANDLER.register('/control/api/systems', SYSTEM_LIST);
		// Add mock user to the system
	MOCK_REQ_HANDLER.register('/control/api/user/current', new MockUser());
}
