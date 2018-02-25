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
     public modules: any = {};
     public exists = true;

     constructor(srv: object, sys_id: string) {
         this.service = srv;
         this.parent = srv;
         this.id = sys_id;
     }
    /**
     * Gets the module with the given id and index
     * @param id Module name
     * @param index Index of module in system
     * @return  Returns the module with the given id and index
     */
    public get(id: string, index: number | string = 1) {
        if (id.indexOf('_') >= 0) {
            const parts = id.split('_');
            id = parts[0];
            index = parts[1];
        }
        const name = `${id}_${index}`;
        if (this.modules[name]) {
            return this.modules[name];
        }
        const module = new Module(this.service, this, id, +index);
        this.modules[name] = module;
        return module;
    }
    /**
     * Rebinds all bound status variables on existing modules in the system
     * @return
     */
     public rebind() {
         for (const mod of this.modules) {
             mod.rebind();
         }
     }

 }
