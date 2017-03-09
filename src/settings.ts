/*
* @Author: Alex Sorafumo
* @Date:   2017-03-08 11:23:08
* @Last Modified by:   Alex Sorafumo
* @Last Modified time: 2017-03-08 11:58:56
*/

export class COMPOSER_SETTINGS {
	static debug: boolean = false;
	static control: any[] = [];

	constructor() {
		this.loadSettings();
	}

	private loadSettings() {
		let globalScope = self;
		if(globalScope) {
			if(globalScope['debug']) {
				COMPOSER_SETTINGS.debug = true;
			}
	        if(globalScope['systemData']) COMPOSER_SETTINGS.control = globalScope['systemData'];
	        else if(globalScope['systemsData']) COMPOSER_SETTINGS.control = globalScope['systemsData'];
	        else if(globalScope['control'] && globalScope['control']['systems']) COMPOSER_SETTINGS.control = globalScope['control']['systems'];
		}
	}
}

let Settings = new COMPOSER_SETTINGS();
