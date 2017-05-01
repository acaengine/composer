/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-01 14:23:37
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-01 14:53:54
 */

import { Injectable } from '@angular/core';
import { ClientMessageBrokerFactory, FnArg, PRIMITIVE, UiArguments } from '@angular/platform-webworker';

@Injectable()
export class DataStoreWorkerService extends DataStoreService {
    private broker: any = null;

    constructor(private brokerFactory: ClientMessageBrokerFactory) {
        super();
        if (this.brokerFactory) {
            this.broker = brokerFactory.createMessageBroker('COMPOSER Storage Broker');
        }
    }

    private execOnUI(fn: string, args: any[]) {
        return new Promise<any>((resolve, reject) => {
            if (this.broker) {
                const argments = [];
                for (const arg of args) {
                    argments.push(new FnArg(arg, PRIMITIVE));
                }
                const method = new UiArguments(fn, argments);
                this.broker.runOnService(method, PRIMITIVE).then((result: string) => {
                    resolve(result);
                });
            } else {
                reject({ message: 'Message Broker does not exist or has not been initialised.' });
            }
        });
    }

    private getItem(type: string, key: string) {
        return new Promise<any>((resolve, reject) => {
            if (this.broker) {
                const exec = `${type === 'local' ? 'localStorage' : 'sessionStorage'}_getItem`;
                this.execOnUI(exec, [key]).then((result: string) => {
                    resolve(result);
                });
            }
        });
    }

    private setItem(type: string, key: string, value: string) {
        return new Promise<any>((resolve, reject) => {
            if (this.broker) {
                const exec = `${type === 'local' ? 'localStorage' : 'sessionStorage'}_setItem`;
                this.execOnUI(exec, [key, value]).then((result: string) => {
                    resolve(result);
                });
            }
        });
    }

    private removeItem(type: string, key: string) {
        return new Promise<any>((resolve, reject) => {
            if (this.broker) {
                const exec = `${type === 'local' ? 'localStorage' : 'sessionStorage'}_removeItem`;
                this.execOnUI(exec, [key]).then((result: string) => {
                    resolve(result);
                });
            }
        });
    }

    private keys(type: string) {
        return new Promise<any>((resolve, reject) => {
            resolve([]);
        });
    }
}
