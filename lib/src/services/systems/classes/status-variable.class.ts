/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-02 10:49:31
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-02 11:09:19
 */

 import { Observable } from 'rxjs/Observable';

 import { COMPOSER } from '../../../settings';

 const EXEC_LIMIT = 10;
 const EXEC_TIME_DELAY = 100;

 export class StatusVariable {
     public id: string;             // Name of status variable
     public parent: any;            // Module connected to status variable
     public previous: any = null;   // Previous value
     public current: any = null;    // Current value
     public bindings: number = 0;   // Binding count
     public exec_active = false;
     public execs: any[] = [];
     public value: any = {};
     public cb_fn: () => void;
     public local_change = false;
     private service: any;           // System service
     private callbacks: any[] = [];  // Execute Callbacks
     private obs: any = null;
     private view: any = null;

     constructor(srv: object, parent: any, name: string, init_val: any) {
         this.id = name;
         this.previous = init_val;
         this.current = init_val;
         this.service = srv;
         this.parent = parent;
         this.value = {
             system_id: this.parent.parent.id,
             module_name: this.parent.id,
             module_index: this.parent.index,
             name: this.id,
         };
         setInterval(() => {
             this.exec();
         }, 1000 / EXEC_LIMIT);
     }
    /**
     * Hook for getting changes to the status variable
     * @return {Observable} Returns an observerable that post changes to the status variable
     */
     get observe() {
         if (!this.obs) {
             return this.bound();
         } else {
             return this.obs;
         }
     }

     public bound() {
         const mod = `${this.parent.id} ${this.parent.index}`;
         const msg = `Bound to ${this.id} on ${mod} in ${this.parent.parent.id}, Value:`;
         COMPOSER.log('BIND', msg, this.current);
         if (!this.obs) {
             this.obs = new Observable((observer: any) => {
                 let val = this.current;
                 this.view = observer;
                 setInterval(() => {
                     if (this.bindings === 0) {
                         observer.complete();
                         this.obs = null;
                         this.view = null;
                     }
                     if (this.current !== val) {
                         val = this.current;
                         observer.next(this.current);

                     }
                 }, 100);
             });
         }
         setTimeout(() => {
             if (this.view) {
                 this.view.next(this.current);
             }
             this.callback();
         }, 200);
         return this.obs;
     }
    /**
     * Execute the next function in the stack
     * @return {void}
     */
     public exec() {
         if (this.execs.length > 0) {
             const mod = this.parent;
             const e = this.execs[this.execs.length - 1];
             if (this.current !== e.value) {
                 this.service.io.exec(mod.parent.id, mod.id, mod.index, e.fn, e.value)
                 .then((data) => { e.resolve(data); }, (err) => { e.reject(err); });
             }
             this.execs = [];
         }
     }

     public update(params: any) {
         return;
     }
    /**
     * Unbind from this variable
     * @return {void}
     */
     public unbind() {
         COMPOSER.log('VAR', `Unbound binding. ${this.bindings-1} remaining.`);
         if (this.bindings <= 1) {
             this.parent.unbind(this.id);
         }
     }

    /**
     * Adds a new callback function to the collection
     * @param  {() => void} cb_fn Function to add to the binding
     * @return {void}
     */
     public add_cb_fn(cb_fn: () => void) {
         if (cb_fn !== undefined || cb_fn !== null) {
             this.callbacks.push(cb_fn);
         }
     }
    /**
     * Called when an execute returns successful
     * @param  {any}  msg Message returned by the server
     * @return {void}
     */
     private success(msg: any) {
         if (msg.meta.cmd === 'exec') {
             this.previous = this.current;
             this.current = msg.meta.args;
             this.local_change = true;
             this.exec_active = false;
             // Execute call backs
             this.callback();
             // Execute next function in the stack
             this.exec();
         }
     }

    /**
     * Called when an execute returns error
     * @param  {any}  msg Message returned by the server
     * @return {void}
     */
     private error(msg: any) {
         return;
     }

    /**
     * Called when an status variable is updated on the server side
     * @param  {any}  msg Message returned by the server
     * @return {void}
     */
     private notify(msg: any) {
         this.local_change = false;
         this.previous = this.current;
         this.current = msg.value;
         this.callback();
     }

    /**
     * Calls the callback for each binding
     * @return {void}
     */
     private callback() {
         for (const cb of this.callbacks) {
             if (cb instanceof Function) {
                 cb(this.current, this.previous);
             }
         }
     }
 }
