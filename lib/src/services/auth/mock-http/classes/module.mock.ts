/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-01 15:18:23
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-02 11:14:16
 */

 import { MockClass } from './class.mock';

 export const MODULE_LIST: any[] = [];

 export class MockModule extends MockClass {
     private static COUNT: number = 0;

     constructor() {
         super();
         this.gen_id('mod_Fd-', ++MockModule.COUNT);

     }

 }
