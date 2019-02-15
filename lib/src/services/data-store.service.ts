/*
 * @Author: Alex Sorafumo
 * @Date:   2017-03-09 09:05:57
 * @Last Modified by: Alex Sorafumo
 * @Last Modified time: 2017-12-15 09:33:25
 */

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class DataStoreService {
    protected store: any = {};

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
                return new Promise<string>((resolve, reject) => {
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
            keys: () => {
                return new Promise<string[]>((resolve, reject) => {
                    this.keys('local').then((keys) => {
                        resolve(keys);
                    });
                });
            },
            cache: {},
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
                return new Promise<string>((resolve, reject) => {
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
            keys: () => {
                return new Promise<string[]>((resolve, reject) => {
                    this.keys('session').then((keys) => {
                        resolve(keys);
                    });
                });
            },
            cache: {},
        };
    }

    get local() { return this.store.local; }
    get session() { return this.store.session; }

    protected getItem(type: string, key: string): Promise<string> {
        return new Promise<string>((resolve) => {
            if (type === 'local' && localStorage) {
                resolve(localStorage.getItem(key));
            } else if (type !== 'local' && sessionStorage) {
                resolve(sessionStorage.getItem(key));
            }
        });

    }

    protected setItem(type: string, key: string, value: string): Promise<string> {
        return new Promise<string>((resolve) => {
            if (type === 'local' && localStorage) {
                localStorage.setItem(key, value);
                resolve(value);
            } else if (type !== 'local' && sessionStorage) {
                sessionStorage.setItem(key, value);
                resolve(value);
            }
        });
    }

    protected removeItem(type: string, key: string): Promise<string> {
        return new Promise<string>((resolve) => {
            if (type === 'local' && localStorage) {
                localStorage.removeItem(key);
                resolve(null);
            } else if (type !== 'local' && sessionStorage) {
                sessionStorage.removeItem(key);
                resolve(null);
            }
        });
    }

    protected keys(type: string): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
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
            resolve(keys);
        });
    }
}
