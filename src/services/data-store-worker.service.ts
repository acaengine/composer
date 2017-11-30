/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-01 14:23:37
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-02 11:30:53
 */
/*
import { Injectable } from '@angular/core';
import { ClientMessageBrokerFactory, FnArg, SerializerTypes, UiArguments } from '@angular/platform-webworker';

import { DataStoreService } from './data-store.service';

@Injectable()
export class DataStoreWorkerService extends DataStoreService {
    private broker: any = null;

    constructor(private brokerFactory: ClientMessageBrokerFactory) {
        super();
        if (this.brokerFactory) {
            this.broker = brokerFactory.createMessageBroker('COMPOSER Storage Broker');
        }
    }

    protected getItem(type: string, key: string) {
        return new Promise<any>((resolve, reject) => {
            if (this.broker) {
                const exec = `${type === 'local' ? 'localStorage' : 'sessionStorage'}_getItem`;
                this.execOnUI(exec, [key]).then((result: string) => {
                    resolve(result);
                });
            }
        });
    }

    protected setItem(type: string, key: string, value: string) {
        return new Promise<any>((resolve, reject) => {
            if (this.broker) {
                const exec = `${type === 'local' ? 'localStorage' : 'sessionStorage'}_setItem`;
                this.execOnUI(exec, [key, value]).then((result: string) => {
                    resolve(result);
                });
            }
        });
    }

    protected removeItem(type: string, key: string) {
        return new Promise<any>((resolve, reject) => {
            if (this.broker) {
                const exec = `${type === 'local' ? 'localStorage' : 'sessionStorage'}_removeItem`;
                this.execOnUI(exec, [key]).then((result: string) => {
                    resolve(result);
                });
            }
        });
    }

    protected keys(type: string) {
        return new Promise<any>((resolve, reject) => {
            if (this.broker) {
                const exec = `${type === 'local' ? 'localStorage' : 'sessionStorage'}_keys`;
                this.execOnUI(exec, []).then((result: string) => {
                    resolve(result);
                });
            }
        });
    }

    private execOnUI(fn: string, args: any[]) {
        return new Promise<any>((resolve, reject) => {
            if (this.broker) {
                const argments = [];
                for (const arg of args) {
                    argments.push(new FnArg(arg, SerializerTypes.PRIMITIVE));
                }
                const method = new UiArguments(fn, argments);
                this.broker.runOnService(method, SerializerTypes.PRIMITIVE).then((result: string) => {
                    resolve(result);
                });
            } else {
                reject({ message: 'Message Broker does not exist or has not been initialised.' });
            }
        });
    }

}
