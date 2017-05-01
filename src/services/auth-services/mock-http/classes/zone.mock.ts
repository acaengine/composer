/*
* @Author: Alex Sorafumo
* @Date:   2017-05-01 15:13:53
* @Last Modified by:   Alex Sorafumo
* @Last Modified time: 2017-05-01 15:27:58
*/

import { MockClass } from './class.mock';

export const ZONE_LIST: any[] = [];

export class MockZone extends MockClass {
    private static COUNT: number = 0;

    constructor() {
        super();
        this.gen_id('zone_Fd-', ++MockZone.COUNT);
    }
}
