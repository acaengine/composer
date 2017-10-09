/*
 * @Author: Alex Sorafumo
 * @Date:   2017-03-08 11:23:08
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-12 14:30:34
 */

import { Observable } from 'rxjs/Observable';

export class COMPOSER {
    public static var_list: string[] = ['debug'];
    public static data: any = {};
    public static obs: any = {};
    public static _obs: any = {};

    public static get(name: string) {
        return this.data[name];
    }

    public static observe(var_name: string) {
        if (!COMPOSER.obs[var_name]) {
            COMPOSER.obs[var_name] = new Observable<any>((observer) => {
                COMPOSER._obs[var_name] = observer;
                setTimeout(() => {
                    COMPOSER._obs[var_name].next(COMPOSER.data[var_name]);
                }, 200);
            });
        }
        return COMPOSER.obs[var_name];
    }

    public static loadSettings() {
        const globalScope = self as any;
        if (globalScope) {
            for (const i of COMPOSER.var_list) {
                if (globalScope[i] !== undefined &&
                    (COMPOSER.data[i] === undefined || globalScope[i] !== COMPOSER.data[i])) {
                    COMPOSER.data[i] = globalScope[i];
                    if (!COMPOSER.obs[i] || !COMPOSER._obs[i]) {
                        COMPOSER.obs[i] = new Observable((observer) => {
                            COMPOSER._obs[i] = observer;
                            COMPOSER._obs[i].next(COMPOSER.data[i]);
                        });
                    } else if (COMPOSER._obs[i]) {
                        COMPOSER._obs[i].next(COMPOSER.data[i]);
                    }

                }
            }
            // Load data for mock control systems
            if (globalScope.systemData) {
                COMPOSER.data.control = globalScope.systemData;
            } else if (globalScope.systemsData) {
                COMPOSER.data.control = globalScope.systemsData;
            } else if (globalScope.control && globalScope.control.systems) {
                COMPOSER.data.control = globalScope.control.systems;
            }
        }
    }

    public static log(type: string, msg: string, args?: any, out: string = 'debug', color?: string) {
        if (COMPOSER.data && COMPOSER.data.debug) {
            const clr = color ? color : '#009688';
            const COLOURS = ['color: #0288D1', `color:${clr}`, 'color:rgba(0,0,0,0.87)'];
            if (args) {
                if (COMPOSER.hasColours()) {
                    console[out](`%c[COMPOSER]%c[${type}] %c${msg}`, ...COLOURS, args);
                } else {
                    console[out](`[COMPOSER][${type}] ${msg}`, args);
                }
            } else {
                if (COMPOSER.hasColours()) {
                    console[out](`%c[COMPOSER]%c[${type}] %c${msg}`, ...COLOURS);
                } else {
                    console[out](`[COMPOSER][${type}] ${msg}`);
                }
            }
        }
    }

    public static error(type: string, msg: string, args?: any) {
        COMPOSER.log(type, msg, args, 'error');
    }

    public static version(version: string, build: string, out: any = 'debug') {
        const COLOURS = ['color: #f44336', `color: #9c27b0`, 'color:rgba(0,0,0,0.87)'];
        if (COMPOSER.hasColours()) {
            console[out](`%c[ACA]%c[LIBRARY] %cComposer - Version: ${version} | Build: ${build}`, ...COLOURS);
        } else {
            console[out](`[ACA][LIBRARY] Composer - Version: ${version} | Build: ${build}`);
        }
    }

    private static hasColours() {
        const doc = document as any;
        return !(doc.documentMode || /Edge/.test(navigator.userAgent));
    }

    constructor() {
        throw new Error('This class is static');
    }

}

setTimeout(() => {
    COMPOSER.loadSettings();
    setInterval(() => {
        COMPOSER.loadSettings();
    }, 1000);
}, 50);
