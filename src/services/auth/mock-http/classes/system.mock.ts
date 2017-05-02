/*
* @Author: Alex Sorafumo
* @Date:   2017-05-01 15:18:12
* @Last Modified by:   Alex Sorafumo
* @Last Modified time: 2017-05-01 15:54:09
*/

import { MockClass } from './class.mock';

export const SYSTEM_LIST: any[] = [];

export class MockSystem extends MockClass {
    private static COUNT: number = 0;

    constructor(id?: string, data?: any) {
        super();
        if (!id) {
            this.gen_id('sys_Fd-', ++MockSystem.COUNT);
        } else {
            this.id = id;
            if (data) {
                if (data && data.System && data.System[0] && data.System[0].name) {
                    this.name = data.System[0].name;
                }
                for (const i in data) {
                    if (data[i] && !(this[i] instanceof Function)) {
                        this[i] = data[i];
                    }
                }
            }
        }

    }

}
