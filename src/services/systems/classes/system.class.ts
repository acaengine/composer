/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-02 10:47:09
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-02 10:51:11
 */

 import { COMPOSER } from '../../../settings';
 import { Module } from './module.class';

 export class System {
     public id: string;
     public service: any;
     public parent: any;
     public modules: Module[] = [];
     public exists = true;

     constructor(srv: object, sys_id: string) {
         this.service = srv;
         this.parent = srv;
         this.id = sys_id;
     }
    /**
     * Gets the module with the given id and index
     * @param  {string}      mod_id Module name
     * @param  {number = 1}  index Index of module in system
     * @return {Module} Returns the module with the given id and index
     */
     public get(mod_id: string, index: number = 1) {
         let module: any = null;
         // Check if system already exists
         for (let i = 0; i < this.modules.length; i++) {
             if (this.modules[i].id === mod_id && this.modules[i].index === index) {
                 module = this.modules[i];
             }
         }
         if (module === null) {
             // System not stored create new one.
             module = new Module(this.service, this, mod_id, index);
             this.modules.push(module);
         }
         return module;
     }
    /**
     * Rebinds all bound status variables on existing modules in the system
     * @return {void}
     */
     public rebind() {
         for (const mod of this.modules) {
             mod.rebind();
         }
     }

 }
