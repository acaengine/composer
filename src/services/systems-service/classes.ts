/**
* @Author: Alex Sorafumo
* @Date:   19/10/2016 10:47 AM
* @Email:  alex@yuion.net
* @Filename: classes.ts
* @Last modified by:   Alex Sorafumo
* @Last modified time: 15/12/2016 11:41 AM
*/

import { Observable } from 'rxjs/Observable';

const EXEC_LIMIT = 10;
const EXEC_TIME_DELAY = 100;

export class StatusVariable {
    id: string;
    private service: any;
    parent: any;
    previous: any = null;
    current: any = null;
    private callbacks: any[] = [];
    bindings: number = 0;
    exec_active = false;
    execs: any[] = [];
    value: any = {};
    cb_fn: Function;
    local_change = false;
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

    get observe(){
        return new Observable((observer: any) => {
            let val = this.current;
            setInterval(() => {
                if(this.bindings === 0) observer.complete();
                if(this.current !== val){
                    val = this.current;
                    observer.next(this.current);
                }
            }, 100);
        });
    }

    success(msg: any) {
        if(msg.meta.cmd == 'exec') {
            this.previous = this.current;
            this.current = msg.meta.args;
            this.local_change = true;
            this.exec_active = false;
            this.callback();
            this.exec();
        }
    }

    error(msg: any) {

    }

    notify(msg: any) {
        this.local_change = false;
        this.previous = this.current;
        this.current = msg.value;
        this.callback();
    }

    private callback(){
        for(var i = 0; i < this.callbacks.length; i++) {
            if(this.callbacks[i]) this.callbacks[i](this.current, this.previous);
        }
    }

    add_cb_fn(cb_fn: Function){
        if(cb_fn !== undefined || cb_fn !== null) this.callbacks.push(cb_fn);
    }

    exec() {
        if(this.execs.length > 0) {
            let mod = this.parent;
            let e = this.execs[this.execs.length-1];
            if(this.current !== e.value) {
                let id = this.service.io.exec(mod.parent.id, mod.id, mod.index, e.fn, e.value);
                if(this.parent.debugger && this.parent.debugger.enabled) {
                    this.parent.debugger.addMessage('Exec request: ' + id + ' | fn: ' + e.fn + ', params: ' + e.value);
                } //else console.debug(this.parent.now + ' - Exec request: ' + id + ' | fn: ' + e.fn + ', params: ' + e.value);
            }
            this.execs = [];
        }
    }

    update(params: any) {

    }

    unbind() {
        if(this.bindings > 1) {
            this.bindings--;
        } else if(this.bindings == 1) {
            this.parent.unbind(this.id);
        }
    }
}

export class Module {
    id: string;
    service: any;
    parent: any;
    index: number = 0;
    status_variables: StatusVariable[] = [];
    debugger: any;

    constructor(srv: Object, parent: any, name: string, i: number) {
        this.id = name
        this.service = srv;
        this.parent = parent;
        this.index = i;
    }

    bind(prop: string, cb_fn?: Function) {
        let success = this.service.io.bind(this.parent.id, this.id, this.index, prop);
        if(this.debugger && this.debugger.enabled) this.debugger.addMessage('Bind request: ' + success);
        //else console.debug(this.now + ' - Bind request: ' + success);
        if(success){
            let val = this.get(prop);
            val.bindings++;
            val.add_cb_fn(cb_fn);
            return () => { val.unbind(); };
        } else {
            return null;
        }
    }

    exec(fn: string, prop: string, value: any) {
        let now = (new Date()).getTime();
        let ids = {
            system_id: this.parent.id,
            module_name: this.id,
            module_index: this.index,
            name: prop
        }
        let sv = this.get(prop);
        console.log(fn, prop, value);
        if(sv.bindings <= 0 && prop && prop !== '') {
            console.error('Error: Variable "' + prop + '" not bound!')
            return 'Error: Variable not bound!';
        } else if(!prop || prop === '') { // Call function not bound to variable
            return this.service.io.exec(this.parent.id, this.id, this.index, fn, value);
        }

        sv.execs.push({
            prop: prop,
            fn: fn,
            value: value
        });
    }

    unbind(prop: string) {
        let val = this.get(prop);
        val.bindings = 0;
        let id = this.service.io.unbind(this.parent.id, this.id, this.index, prop);
        if(this.debugger && this.debugger.enabled) this.debugger.addMessage('Unbind request: ' + id);
        else console.debug(this.now + ' - Unbind request: ' + id);
    }

    debug(){
        let id = this.service.io.debug(this.parent.id, this.id, this.index);
        if(this.debugger && this.debugger.enabled) this.debugger.addMessage('Debug request: ' + id);
        else console.debug(this.now + ' - Debug request: ' + id);
    }

    ignore(){
        let id = this.service.io.ignore(this.parent.id, this.id, this);
        if(this.debugger && this.debugger.enabled) this.debugger.addMessage('Ignore request: ' + id);
        else console.debug(this.now + ' - Ignore request: ' + id);
    }

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

    rebind(){
        for(let i = 0; i < this.status_variables.length; i++){
            if(this.status_variables[i].bindings > 0){
                this.bind(this.status_variables[i].id);
            }
        }
    }

    setDebug(debug: any){
        if(typeof debug !== 'object') return false;
        this.debugger = debug;
        console.log('Debugger bound to module ' + this.id + ' ' + this.index + ' on system ' + this.parent.id);
        return true;
    }

    private months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    get now(){
        let now = (new Date());
        let time = now.getDate().toString() + '-' + this.months[now.getMonth()] + '-' + now.getFullYear().toString() + ' @ ';
        let min = now.getMinutes() < 10 ? '0' + now.getMinutes().toString() : now.getMinutes().toString();
        let sec = now.getSeconds() < 10 ? '0' + now.getSeconds().toString() : now.getSeconds().toString();
        time += now.getHours().toString() + ':' + min + ':' + sec;
        return time;
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

    get(mod_id: string, index: number = 1) {
        let module: any = null;
        // Check if system already exists
        for(let i = 0; i < this.modules.length; i++) {
            if(this.modules[i].id == mod_id) {
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

    rebind(){
        for(let i = 0; i < this.modules.length; i++) {
                this.modules[i].rebind();
        }
    }

}
