/**
* @Author: Alex Sorafumo
* @Date:   19/10/2016 10:47 AM
* @Email:  alex@yuion.net
* @Filename: classes.ts
* @Last modified by:   Alex Sorafumo
* @Last modified time: 25/01/2017 2:29 PM
*/

import { Observable } from 'rxjs/Observable';

import { COMPOSER_SETTINGS } from '../../settings';

const EXEC_LIMIT = 10;
const EXEC_TIME_DELAY = 100;

export class StatusVariable {
    id: string;             // Name of status variable
    private service: any;   // System service
    parent: any;            // Module connected to status variable
    previous: any = null;   // Previous value
    current: any = null;    // Current value
    private callbacks: any[] = []; // Execute Callbacks
    bindings: number = 0;   // Binding count
    exec_active = false;
    execs: any[] = [];
    value: any = {};
    cb_fn: Function;
    local_change = false;
    private obs: any = null;
    private view: any = null;
    constructor(srv: Object, parent: any, name: string, init_val: any) {
        this.id = name;
        this.previous = init_val;
        this.current = init_val;
        this.service = srv;
        this.parent = parent;
        this.value = {
            system_id: this.parent.parent.id,
            module_name: this.parent.id,
            module_index: this.parent.index,
            name: this.id
        }
        setInterval(() => {
            this.exec()
        }, 1000 / EXEC_LIMIT);
    }
    /**
     * Hook for getting changes to the status variable
     * @return {Observable} Returns an observerable that post changes to the status variable
     */
    get observe(){
    	if(!this.obs) {
    		return this.bound();
    	} else {
    		return this.obs;
    	}
    }

    bound() {
    	if(COMPOSER_SETTINGS.get('debug')) console.debug(`[COMPOSER][BIND] Bound to ${this.id} on ${this.parent.id} ${this.parent.index} in ${this.parent.parent.id}, Value:`, this.current)
    	if(!this.obs) {
    		this.obs = new Observable((observer: any) => {
	            let val = this.current;
	            this.view = observer;
	            setInterval(() => {
	                if(this.bindings === 0) {
	                	observer.complete();
	                	this.obs = null;
	                	this.view = null;
	                }
	                if(this.current !== val){
	                    val = this.current;
	                    observer.next(this.current);

	                }
	            }, 100);
	        });
    	}
    	setTimeout(() => {
    		if(this.view) {
    			this.view.next(this.current);
    		}
    		this.callback();
    	}, 200);
    	return this.obs;
    }
    /**
     * Called when an execute returns successful
     * @param  {any}  msg Message returned by the server
     * @return {void}
     */
    success(msg: any) {
        if(msg.meta.cmd == 'exec') {
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
    error(msg: any) {

    }

    /**
     * Called when an status variable is updated on the server side
     * @param  {any}  msg Message returned by the server
     * @return {void}
     */
    notify(msg: any) {
        this.local_change = false;
        this.previous = this.current;
        this.current = msg.value;
        this.callback();
    }

    /**
     * Calls the callback for each binding
     * @return {void}
     */
    private callback(){
        for(var i = 0; i < this.callbacks.length; i++) {
            if(this.callbacks[i]) this.callbacks[i](this.current, this.previous);
        }
    }

    /**
     * Adds a new callback function to the collection
     * @param  {Function} cb_fn Function to add to the binding
     * @return {void}
     */
    add_cb_fn(cb_fn: Function){
        if(cb_fn !== undefined || cb_fn !== null) this.callbacks.push(cb_fn);
    }
    /**
     * Execute the next function in the stack
     * @return {void}
     */
    exec() {
        if(this.execs.length > 0) {
            let mod = this.parent;
            let e = this.execs[this.execs.length-1];
            if(this.current !== e.value) {
                this.service.io.exec(mod.parent.id, mod.id, mod.index, e.fn, e.value)
                	.then((data) => { e.resolve(data); }, (err) => { e.reject(err); });
            }
            this.execs = [];
        }
    }

    update(params: any) {

    }
    /**
     * Unbind from this variable
     * @return {void}
     */
    unbind() {
        this.bindings--;
        console.debug(`[COMPOSER][VAR] Unbound binding. ${this.bindings} remaining.`);
        if(this.bindings <= 0) {
            this.parent.unbind(this.id);
        }
    }
}

export class Module {
    id: string;         // Module name
    service: any;       // Systems Service
    parent: any;        // Module's system
    index: number = 0;  // Module Index
    status_variables: StatusVariable[] = [];
    debugger: any;
    _debug: boolean = false;

    constructor(srv: Object, parent: any, name: string, i: number) {
        this.id = name
        this.service = srv;
        this.parent = parent;
        this.index = i;
        COMPOSER_SETTINGS.observe('debug').subscribe((data: any) => {
        	this._debug = data;
        });
    }
    /**
     * Bind to status variable on module
     * @param  {string}   prop  Name of the status variable to bind
     * @param  {Function} cb_fn Function that is called when the binding value changes
     * @return {Function} Returns a function that can be called to unbind to the status variable
     */
    bind(prop: string, cb_fn?: Function) {
        let val = this.get(prop);
    	if(val.bindings > 0) {
            val.bindings++;
            val.add_cb_fn(cb_fn);
            val.bound();
	        return () => { val.unbind(); };
    	} else {
	        let success = this.service.io.bind(this.parent.id, this.id, this.index, prop);
	        if(success){
	            val.bindings++;
	            val.add_cb_fn(cb_fn);
	            return () => { val.unbind(); };
	        } else {
	            return null;
	        }
	    }
    }

    /**
     * Execute a function on this module on the server
     * @param  {string} fn    Function name
     * @param  {string} prop  Status variable to be changed
     * @param  {any}    args  Arguments to pass to the function
     * @return {Promise<any>|string} Returns a exec promise or an error message
     */
    exec(fn: string, prop: string, args: any) {
        let now = (new Date()).getTime();
        if(prop && prop !== '') {
	        let ids = {
	            system_id: this.parent.id,
	            module_name: this.id,
	            module_index: this.index,
	            name: prop
	        }
        	let sv = this.get(prop);
        	if(sv.bindings <= 0) {
	            if(this._debug) console.error('[COMPOSER][Module] Variable "' + prop + '" not bound!')
	            return new Promise((resolve, reject) => { 
	            	resolve({
	            		type:'error', 
	            		message:`Error: Variable not bound!, ${fn}, ${prop}`, 
	            		args: args
	            	});
	            });
        	} else {
            	return new Promise((resolve, reject) => {
			        sv.execs.push({
			            prop: prop,
			            fn: fn,
			            value: args,
			            resolve: resolve,
			            reject: reject
			        });
            	});
        	}
        } else {
            return this.service.io.exec(this.parent.id, this.id, this.index, fn, args);
        }
    }

    /**
     * Unbind to the give status variable
     * @param  {string} prop Name of the status variable to unbind
     * @return {void}
     */
    unbind(prop: string) {
        let val = this.get(prop);
        val.bindings = 0;
        let id = this.service.io.unbind(this.parent.id, this.id, this.index, prop);
    }

    debug(){
        let id = this.service.io.debug(this.parent.id, this.id, this.index);
    }

    ignore(){
        let id = this.service.io.ignore(this.parent.id, this.id, this);
    }
    /**
     * Get the status variable from the module
     * @param  {string} prop Name of status variable to get
     * @return {StatusVariable} Returns the status variable with the give name
     */
    get(prop: string) {
        for(let i = 0; i < this.status_variables.length; i++){
            if(this.status_variables[i].id == prop) {
                return this.status_variables[i];
            }
        }
        let s_var = new StatusVariable(this.service, this, prop, 0);
        this.status_variables.push(s_var);
        return s_var;
    }

    /**
     * Rebinds all the status variables in the module
     * @return {void}
     */
    rebind(){
        for(let i = 0; i < this.status_variables.length; i++){
            if(this.status_variables[i].bindings > 0){
                this.bind(this.status_variables[i].id);
            }
        }
    }

    /**
     * Sets the debugger for the module
     * @param  {any}    debug Debugger
     * @return {boolean} Returns the active state of the debugger
     */
    setDebug(debug: any){
        if(typeof debug !== 'object') return false;
        this.debugger = debug;
        console.log('Debugger bound to module ' + this.id + ' ' + this.index + ' on system ' + this.parent.id);
        return true;
    }
}

export class System {
    id: string;
    service: any;
    parent: any;
    modules: Module[] = [];
    exists = true;
    constructor(srv: Object, sys_id: string) {
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
    get(mod_id: string, index: number = 1) {
        let module: any = null;
        // Check if system already exists
        for(let i = 0; i < this.modules.length; i++) {
            if(this.modules[i].id == mod_id && this.modules[i].index === index) {
                module = this.modules[i];
            }
        }
        if(module === null) {
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
    rebind(){
        for(let i = 0; i < this.modules.length; i++) {
                this.modules[i].rebind();
        }
    }

}
