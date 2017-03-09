/*
* @Author: Alex Sorafumo
* @Date:   2017-03-09 09:05:57
* @Last Modified by:   Alex Sorafumo
* @Last Modified time: 2017-03-09 21:27:12
*/

import { PlatformRef, Injectable, ReflectiveInjector, Inject } from '@angular/core';
import { ClientMessageBrokerFactory, FnArg, UiArguments, PRIMITIVE } from '@angular/platform-webworker';

@Injectable()
export class DataStoreService {
	protected store: any = {};

	constructor() {

		// Create Interface for LocalStorage
		this.store['local'] = {
			getItem: (key: string) => {
				return new Promise<any>((resolve, reject) => {
					this.getItem('local', key).then((item) => {
						this.store['local'].cache[key] = {
							value: item,
							time: (new Date()).getTime()
						}
						resolve(item);
					}, (err) => {
						reject(err);
					});
				});
			},
			setItem: (key: string, value: string) => {
				return new Promise<any>((resolve, reject) => {
					this.setItem('local', key, value).then((item) => {
						this.store['local'].cache[key] = {
							value: item,
							time: (new Date()).getTime()
						}
						resolve(item);
					}, (err) => {
						reject(err);
					});
				});
			},
			removeItem: (key: string) => {
				return new Promise<any>((resolve, reject) => {
					this.removeItem('local', key).then((item) => {
						this.store['local'].cache[key] = {
							value: item,
							time: (new Date()).getTime()
						}
						resolve();
					}, (err) => {
						reject(err);
					});
				});
			},
			keys: () => {
				return new Promise<any>((resolve, reject) => {
					this.keys('local').then((keys) => {
						resolve(keys);
					});
				});
			},
			cache: {}
		}
		// Create Interface for SessionStorage
		this.store['session'] = {
			getItem: (key: string) => {
				return new Promise<any>((resolve, reject) => {
					this.getItem('session', key).then((item) => {
						this.store['session'].cache[key] = {
							value: item,
							time: (new Date()).getTime()
						}
						resolve(item);
					}, (err) => {
						reject(err);
					});
				});
			},
			setItem: (key: string, value: string) => {
				return new Promise<any>((resolve, reject) => {
					this.setItem('session', key, value).then((item) => {
						this.store['session'].cache[key] = {
							value: item,
							time: (new Date()).getTime()
						}
						resolve(item);
					}, (err) => {
						reject(err);
					});
				});
			},
			removeItem: (key: string) => {
				return new Promise<any>((resolve, reject) => {
					this.removeItem('session', key).then((item) => {
						this.store['session'].cache[key] = {
							value: item,
							time: (new Date()).getTime()
						}
						resolve();
					}, (err) => {
						reject(err);
					});
				});
			},
			keys: () => {
				return new Promise<any>((resolve, reject) => {
					this.keys('session').then((keys) => {
						resolve(keys);
					});
				});
			},
			cache: {}
		}
	}

	get local() {
		return this.store['local'];
	}

	get session() {
		return this.store['session'];
	}

	getItem(type: string, key: string): Promise<string> {
		return new Promise<string>((resolve) => {
			if(type === 'local' && localStorage) {
				resolve(localStorage.getItem(key));
			} else if( type !== 'local' && sessionStorage) {
				resolve(sessionStorage.getItem(key));
			}
		});

	};
	setItem(type: string, key: string, value: string): Promise<void>{
		return new Promise<void>((resolve) => {
			if(type === 'local' && localStorage) {
				resolve(localStorage.setItem(key, value));
			} else if( type !== 'local' && sessionStorage) {
				resolve(sessionStorage.setItem(key, value));
			}
		});
	};

	removeItem(type: string, key: string): Promise<void>{
		return new Promise<void>((resolve) => {
			if(type === 'local' && localStorage) {
				resolve(localStorage.removeItem(key));
			} else if( type !== 'local' && sessionStorage) {
				resolve(sessionStorage.removeItem(key));
			}
		});
	};

	keys(type: string): Promise<any[]> {
		return new Promise<any>((resolve, reject) => {
			resolve([]);
		});
	}
}

@Injectable()
export class DataStoreWorkerService extends DataStoreService {
	private broker: any = null;

	constructor(private brokerFactory: ClientMessageBrokerFactory) {
		super();
		console.log(brokerFactory);
		if(this.brokerFactory){
			this.broker = brokerFactory.createMessageBroker('COMPOSER Storage Broker');
		}
	}

	private execOnUI(fn: string, args: any[]){
		return new Promise<any>((resolve, reject) => {
			if(this.broker) {
				let argments = [];
				for(let arg of args) {
					argments.push(new FnArg(arg, PRIMITIVE));
				}
				let method = new UiArguments(fn, argments);
				this.broker.runOnService(method, PRIMITIVE).then((result: string) => {
					resolve(result);
				});
			} else {
				reject({ message: 'Message Broker does not exist or has not been initialised.' });
			}
		});
	}

	getItem(type: string, key: string) {
		return new Promise<any>((resolve, reject) => {
			if(this.broker) {
				let exec = `${type === 'local' ? 'localStorage' : 'sessionStorage'}_getItem`;
				this.execOnUI(exec, [key]).then((result: string) => {
					resolve(result);
				});
			}
		});
	}

	setItem(type: string, key: string, value: string) {
		return new Promise<any>((resolve, reject) => {
			if(this.broker) {
				let exec = `${type === 'local' ? 'localStorage' : 'sessionStorage'}_setItem`;
				this.execOnUI(exec, [key, value]).then((result: string) => {
					resolve(result);
				});
			}
		});
	}

	removeItem(type: string, key: string) {
		return new Promise<any>((resolve, reject) => {
			if(this.broker) {
				let exec = `${type === 'local' ? 'localStorage' : 'sessionStorage'}_removeItem`;
				this.execOnUI(exec, [key]).then((result: string) => {
					resolve(result);
				});
			}
		});
	}

	keys(type: string) {
		return new Promise<any>((resolve, reject) => {
			resolve([]);
		});
	}
}