/*
 * @Author: Alex Sorafumo
 * @Date:   2017-03-09 09:05:57
 * @Last Modified by: Alex Sorafumo
 * @Last Modified time: 2017-12-15 09:33:25
 */

import { Injectable } from '@angular/core';

export interface IDataStore {
    getItem: (key: string) => Promise<string>;
    setItem: (key: string, value: string) => Promise<string>;
    removeItem: (key: string) => Promise<null>;
    keys: () => Promise<string[]>;
    cache: { [name: string]: { value: string, time: number } };
}

@Injectable({
    providedIn: 'root'
})
export class DataStoreService {
    protected store: { local?: IDataStore, session?: IDataStore } = {};

    constructor() {

        // Create Interface for LocalStorage
        this.store.local = {
            getItem: (key: string) => {
                return new Promise<string>((resolve, reject) => {
                    this.getItem('local', key).then((item) => {
                        this.store.local.cache[key] = {
                            value: item,
                            time: (new Date()).getTime(),
                        };
                        resolve(item);
                    }, (err) => {
                        reject(err);
                    });
                });
            },
            setItem: (key: string, value: string) => {
                return new Promise<string>((resolve, reject) => {
                    this.setItem('local', key, value).then((item) => {
                        this.store.local.cache[key] = {
                            value: item,
                            time: (new Date()).getTime(),
                        };
                        resolve(item);
                    }, (err) => {
                        reject(err);
                    });
                });
            },
            removeItem: (key: string) => {
                return new Promise<null>((resolve, reject) => {
                    this.removeItem('local', key).then((item) => {
                        this.store.local.cache[key] = {
                            value: item,
                            time: (new Date()).getTime(),
                        };
                        resolve();
                    }, (err) => {
                        reject(err);
                    });
                });
            },
            keys: () => this.keys('session'),
            cache: {}
        };
        // Create Interface for SessionStorage
        this.store.session = {
            getItem: (key: string) => {
                return new Promise<string>((resolve, reject) => {
                    this.getItem('session', key).then((item) => {
                        this.store.session.cache[key] = {
                            value: item,
                            time: (new Date()).getTime(),
                        };
                        resolve(item);
                    }, (err) => {
                        reject(err);
                    });
                });
            },
            setItem: (key: string, value: string) => {
                return new Promise<string>((resolve, reject) => {
                    this.setItem('session', key, value).then((item) => {
                        this.store.session.cache[key] = {
                            value: item,
                            time: (new Date()).getTime(),
                        };
                        resolve(item);
                    }, (err) => {
                        reject(err);
                    });
                });
            },
            removeItem: (key: string) => {
                return new Promise<null>((resolve, reject) => {
                    this.removeItem('session', key).then((item) => {
                        this.store.session.cache[key] = {
                            value: item,
                            time: (new Date()).getTime(),
                        };
                        resolve();
                    }, (err) => {
                        reject(err);
                    });
                });
            },
            keys: () => this.keys('session'),
            cache: {}
        };
    }

    get local() { return this.store.local; }
    get session() { return this.store.session; }

    protected async getItem(type: string, key: string): Promise<string> {
        if (type === 'local' && localStorage) {
            return localStorage.getItem(key);
        } else if (type !== 'local' && sessionStorage) {
            return sessionStorage.getItem(key);
        }
    }

    protected async setItem(type: string, key: string, value: string): Promise<string> {
        if (type === 'local' && localStorage) {
            localStorage.setItem(key, value);
            return value;
        } else if (type !== 'local' && sessionStorage) {
            sessionStorage.setItem(key, value);
            return value;
        }
    }

    protected async removeItem(type: string, key: string): Promise<null> {
        if (type === 'local' && localStorage) {
            localStorage.removeItem(key);
            return
        } else if (type !== 'local' && sessionStorage) {
            sessionStorage.removeItem(key);
            return
        }
    }

    protected async keys(type: string): Promise<string[]> {
        const keys: string[] = [];
        if (type === 'local') {
            for (let i = 0; i < localStorage.length; i++) {
                keys.push(localStorage.key(i));
            }
        } else if (type === 'session') {
            for (let i = 0; i < sessionStorage.length; i++) {
                keys.push(sessionStorage.key(i));
            }
        }
        return keys;
    }
}
