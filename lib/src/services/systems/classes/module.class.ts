/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-02 10:48:03
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-02 10:52:20
 */

import { Observable } from 'rxjs/Observable';

import { COMPOSER } from '../../../settings';
import { StatusVariable } from './status-variable.class';

export class Module {
    public id: string;         // Module name
    public parent: any;        // Module's system
    public index: number = 0;  // Module Index
    public status_variables: any = {};
    public debugger: any;
    private _debug: boolean = false;
    private service: any;       // Systems Service

    constructor(srv: object, parent: any, name: string, i: number) {
        this.id = name;
        this.service = srv;
        this.parent = parent;
        this.index = i;
        COMPOSER.observe('debug').subscribe((data: any) => {
            this._debug = data;
        });
    }
    /**
     * Bind to status variable on module
     * @param  {string}   prop  Name of the status variable to bind
     * @param  {() => void} cb_fn Function that is called when the binding value changes
     * @return {() => void} Returns a function that can be called to unbind to the status variable
     */
    public bind(prop: string, next: (change: boolean) => void) {
        const variable = this.get(prop);
        return variable.bind(next);
    }

    /**
     * Execute a function on this module on the server
     * @param  {string} fn    Function name
     * @param  {string} prop  Status variable to be changed
     * @param  {any}    args  Arguments to pass to the function
     * @return {Promise<any>|string} Returns a exec promise or an error message
     */
    public exec(fn: string, args: any) {
        return new Promise((resolve, reject) => {
            const system = this.parent;
            this.service.io.exec(system.id, this.id, this.index, fn, args)
                .then((result) => resolve(result), (err) => reject(err));
        });
    }

    /**
     * Unbind to the give status variable
     * @param  {string} prop Name of the status variable to unbind
     * @return {void}
     */
    public unbind(prop: string) {
        const variable = this.get(prop);
        variable.unbind();
    }

    public debug() {
        const id = this.service.io.debug(this.parent.id, this.id, this.index);
    }

    public ignore() {
        const id = this.service.io.ignore(this.parent.id, this.id, this);
    }
    /**
     * Get the status variable from the module
     * @param  {string} prop Name of status variable to get
     * @return {StatusVariable} Returns the status variable with the give name
     */
    public get(prop: string) {
        if (this.status_variables[prop]) {
            return this.status_variables[prop];
        }
        const s_var = new StatusVariable(this.service, this, prop, 0);
        this.status_variables[prop] = s_var;
        return s_var;
    }

    /**
     * Rebinds all the status variables in the module
     * @return {void}
     */
    public rebind() {
        for (const id in this.status_variables) {
            if (this.status_variables.hasOwnProperty(id)) {
                this.status_variables[id].rebind();
            }
        }
    }

    /**
     * Sets the debugger for the module
     * @param  {any}    debug Debugger
     * @return {boolean} Returns the active state of the debugger
     */
    public setDebug(debug: any) {
        if (typeof debug !== 'object') {
            return false;
        }
        this.debugger = debug;
        COMPOSER.log('Debugger', `Bound to module ${this.id} ${this.index} on system ${this.parent.id}`);
        return true;
    }
}
