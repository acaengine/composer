/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-02 10:35:51
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-03 17:38:15
 */

 import { COMMON } from './common';

 export class Resource {
     public factory: any;   // Parent Factory for resource
     public url: any;       // Resource URL
     public id: any;        // Resource Identifier

     constructor(factory: any, data: any, url: any) {
         this.factory = factory;
         this.url = url;
         if (typeof data === 'object') {
             const keys = Object.keys(data);
             for (const key of keys) {
                 this[key] = data[key];
             }
         }
     }
    /**
     * Posts changes made to the resource to the server
     * @return {any} Returns the responce from the server
     */
     public save() {
         if (!this.url || this.id === undefined) {
             return {};
         }
         // Remember class related variables
         const f = this.factory; const s = this.save; const url = this.url;
         // Remove class related variables
         delete this.save; delete this.factory; delete this.url;
         const req_data = JSON.parse(JSON.stringify(this));
         // Re-add class related variables
         this.save = s; this.factory = f; this.url = url;
         return (new Promise((resolve, reject) => {
             let result: any;
             const method = JSON.parse(JSON.stringify(COMMON.crud.save));
             method.url = url;
             this.factory._put(COMMON.crud.save, { id: this.id }, req_data)
             .subscribe(
                        (data: any) => result = data,
                        (err: any) => reject(err),
                        () => resolve(result),
                        );
         })).then((res) => res, (err) => err);
     }
 }
