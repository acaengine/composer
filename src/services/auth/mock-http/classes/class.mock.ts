/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-01 15:14:46
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-02 11:14:23
 */

 import * as faker from 'faker';

 const CHAR_LIST = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV';

 export class MockClass {
     public id: string = '';
     public name: string = '';

     constructor() {
         this.name = faker.commerce.department() + ' ' + faker.company.bsNoun();
     }

     public match(value: any, field?: string) {
         return false;
     }

     public update(data: any) {
         return;
     }

     public gen_id(prefix: string, cnt: number) {
         let id = '';
         while (cnt > 0) {
             id = CHAR_LIST[cnt % CHAR_LIST.length] + id;
             cnt = Math.floor(cnt / CHAR_LIST.length);
         }
         this.id = prefix + id;
     }
 }
