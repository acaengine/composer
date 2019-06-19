/*
 * @Author: Alex Sorafumo
 * @Date:   2017-03-09 09:51:16
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-02 10:19:35
 */
/*
import { PlatformRef } from '@angular/core';
import { SerializerTypes, ServiceMessageBrokerFactory } from '@angular/platform-webworker';

export class DataStoreBroker {
    public static broker: any = null;
    constructor(ref: PlatformRef) {
        if (!DataStoreBroker.broker) {
            DataStoreBroker.broker = ref.injector.get(ServiceMessageBrokerFactory)
                .createMessageBroker('COMPOSER Storage Broker');
            this.registerLocalStorage();
            this.registerSessionStorage();
        }
    }

    private registerLocalStorage() {
        if (localStorage) {
            // Register LocalStorage getItem function
            DataStoreBroker.broker.registerMethod('localStorage_getItem', [SerializerTypes.PRIMITIVE], (key: string) => {
                return new Promise<any>((res) => res(localStorage.getItem(key)));
            }, SerializerTypes.PRIMITIVE);
            // Register LocalStorage setItem function
            DataStoreBroker.broker.registerMethod('localStorage_setItem', [SerializerTypes.PRIMITIVE], (key: string, value: string) => {
                return new Promise<any>((res) => res(localStorage.setItem(key, value)));
            }, SerializerTypes.PRIMITIVE);
            // Register LocalStorage removeItem function
            DataStoreBroker.broker.registerMethod('localStorage_removeItem', [SerializerTypes.PRIMITIVE], (key: string) => {
                return new Promise<any>((res) => res(localStorage.removeItem(key)));
            }, SerializerTypes.PRIMITIVE);
            // Register LocalStorage keys function
            DataStoreBroker.broker.registerMethod('localStorage_keys', [SerializerTypes.PRIMITIVE], (key: string) => {
                return new Promise<any>((res) => {
                    const keys: string[] = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        keys.push(localStorage.key(i));
                    }
                    res(keys);
                });
            }, SerializerTypes.PRIMITIVE);
        }
    }

    private registerSessionStorage() {
        if (sessionStorage) {
            // Register SessionStorage getItem function
            DataStoreBroker.broker.registerMethod('sessionStorage_getItem', [SerializerTypes.PRIMITIVE], (key: string) => {
                return new Promise<any>((res) => res(sessionStorage.getItem(key)));
            }, SerializerTypes.PRIMITIVE);
            // Register SessionStorage setItem function
            DataStoreBroker.broker.registerMethod('sessionStorage_setItem', [SerializerTypes.PRIMITIVE],
               (key: string, value: string) => {
                return new Promise<any>((res) => res(sessionStorage.setItem(key, value)));
            }, SerializerTypes.PRIMITIVE);
            // Register SessionStorage keys function
            DataStoreBroker.broker.registerMethod('sessionStorage_keys', [SerializerTypes.PRIMITIVE], (key: string) => {
                return new Promise<any>((res) => {
                    const keys: string[] = [];
                    for (let i = 0; i < sessionStorage.length; i++) {
                        keys.push(sessionStorage.key(i));
                    }
                    res(keys);
                });
            }, SerializerTypes.PRIMITIVE);
        }
    }
 }
 */
