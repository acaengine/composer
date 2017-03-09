/*
* @Author: Alex Sorafumo
* @Date:   2017-03-09 09:51:16
* @Last Modified by:   Alex Sorafumo
* @Last Modified time: 2017-03-09 17:12:19
*/

import { PlatformRef } from '@angular/core';
import { ServiceMessageBrokerFactory, PRIMITIVE } from '@angular/platform-webworker';

export class DataStoreBroker {
	static broker: any = null;
	constructor(ref: PlatformRef) {
		if(!DataStoreBroker.broker){
			DataStoreBroker.broker = ref.injector.get(ServiceMessageBrokerFactory).createMessageBroker('COMPOSER Storage Broker');
			this.registerLocalStorage();
			this.registerSessionStorage();
		}
	}

	private registerLocalStorage() {
		if(localStorage){
				// Register LocalStorage getItem function
			DataStoreBroker.broker.registerMethod('localStorage_getItem', [PRIMITIVE], (key) => {
				return new Promise<any>((res)=>res(localStorage.getItem(key)));
			}, PRIMITIVE);
				// Register LocalStorage setItem function
			DataStoreBroker.broker.registerMethod('localStorage_setItem', [PRIMITIVE], (key, value) => {
				return new Promise<any>((res)=>res(localStorage.setItem(key, value)));
			}, PRIMITIVE);
				// Register LocalStorage removeItem function
			DataStoreBroker.broker.registerMethod('localStorage_removeItem', [PRIMITIVE], (key) => {
				return new Promise<any>((res)=>res(localStorage.removeItem(key)));
			}, PRIMITIVE);
		}
	}

	private registerSessionStorage() {
		if(sessionStorage){
				// Register SessionStorage getItem function
			DataStoreBroker.broker.registerMethod('sessionStorage_getItem', [PRIMITIVE], (key) => {
				return new Promise<any>((res)=>res(sessionStorage.getItem(key)));
			}, PRIMITIVE);
				// Register SessionStorage setItem function
			DataStoreBroker.broker.registerMethod('sessionStorage_setItem', [PRIMITIVE], (key, value) => {
				return new Promise<any>((res)=>res(sessionStorage.setItem(key, value)));
			}, PRIMITIVE);
				// Register SessionStorage removeItem function
			DataStoreBroker.broker.registerMethod('sessionStorage_removeItem', [PRIMITIVE], (key) => {
				return new Promise<any>((res)=>res(sessionStorage.removeItem(key)));
			}, PRIMITIVE);
		}
	}
}