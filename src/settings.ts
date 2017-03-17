/*
* @Author: Alex Sorafumo
* @Date:   2017-03-08 11:23:08
* @Last Modified by:   Alex Sorafumo
* @Last Modified time: 2017-03-17 14:40:33
*/

import { Observable } from 'rxjs/Observable';

export class COMPOSER_SETTINGS {
	static var_list: string[] = ['debug'];
	static data: any = {};
	static obs: any = {};
	static _obs: any = {};

	static get(name: string) {
		return this.data[name];
	}

	static observe(var_name: string) {
		if(!COMPOSER_SETTINGS.obs[var_name]) {
			COMPOSER_SETTINGS.obs[var_name] = new Observable((observer) => {
				COMPOSER_SETTINGS._obs[var_name] = observer;
				setTimeout(() => {
					COMPOSER_SETTINGS._obs[var_name].next(COMPOSER_SETTINGS.data[var_name]);
				}, 200);
			});
		}
		return COMPOSER_SETTINGS.obs[var_name];
	}

	static loadSettings() {
		let globalScope = self;
		if(globalScope) {
			for(let i of COMPOSER_SETTINGS.var_list) {
				if(globalScope[i] !== undefined && (COMPOSER_SETTINGS.data[i] === undefined || globalScope[i] !== COMPOSER_SETTINGS.data[i])) {
					//console.log(`[COMPOSER][SETTINGS] ${i} was changed from ${COMPOSER_SETTINGS.data[i]} to ${globalScope[i]}`)
					COMPOSER_SETTINGS.data[i] = globalScope[i];
					if(!COMPOSER_SETTINGS.obs[i] || !COMPOSER_SETTINGS._obs[i]) {
						COMPOSER_SETTINGS.obs[i] = new Observable((observer) => {
							COMPOSER_SETTINGS._obs[i] = observer;
							COMPOSER_SETTINGS._obs[i].next(COMPOSER_SETTINGS.data[i]);
						});
					} else if(COMPOSER_SETTINGS._obs[i]){
						COMPOSER_SETTINGS._obs[i].next(COMPOSER_SETTINGS.data[i]);
					}

				}
			}
				// Load data for mock control systems
	        if(globalScope['systemData']) {
	        	COMPOSER_SETTINGS.data['control'] = globalScope['systemData'];
	        } else if(globalScope['systemsData']) {
	        	COMPOSER_SETTINGS.data['control'] = globalScope['systemsData'];
	        } else if(globalScope['control'] && globalScope['control']['systems']) {
	        	COMPOSER_SETTINGS.data['control'] = globalScope['control']['systems'];
	        }
		}
	}
}

setTimeout(() => {
	COMPOSER_SETTINGS.loadSettings();
	setInterval(() => {
		COMPOSER_SETTINGS.loadSettings();
	}, 2000);
}, 200);

