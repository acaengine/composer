
export class StatusVariable {
    id: string;
    service: any;
    parent: any;
    previous: any = null;
    current: any = null;
    callbacks: Function[] = [];
    bindings: number = 0;
    value: any = {};
    cb_fn: Function;
    constructor(srv: Object, parent: any, name: string, init_val: any) {
        this.id = name;
        this.previous = init_val;
        this.current = init_val;
        this.parent = parent;
        this.value = {
            system_id: this.parent.parent.id,
            module_name: this.parent.id,
            module_index: this.parent.index,
            name: this.id
        }
    }

    success(msg: any) {
        console.log(msg);
        if(msg.meta.cmd == 'exec') {
            this.previous = this.current;
            this.current = msg.meta.args;
            if(this.cb_fn) this.cb_fn(this.current, this.previous);
        }
    }

    error(msg: any) {

    }

    notify(msg: any) {
        this.previous = this.current;
        this.current = msg.value;
        if(this.cb_fn) this.cb_fn(this.current, this.previous);
    }

    update(params: any) {

    }

    unbind() {
        console.log('Unbind Callback for ' + this.id);
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
    constructor(srv: Object, parent: any, name: string, i: number) {
        this.id = name
        this.service = srv;
        this.parent = parent;
        this.index = i;
    }

    bind(prop: string, cb_fn: Function) {
        this.service.io.bind(this.parent.id, this.id, this.index, prop);
        let val = this.get(prop);
        val.bindings++;
        val.cb_fn = cb_fn;
        return function() { val.unbind(); };
    }

    exec(fn: string, prop: string, value: any) {
        console.log('Perform Exec');
        let ids = {
            system_id: this.parent.id,
            module_name: this.id,
            module_index: this.index,
            name: prop
        }
        var sv = this.get(prop);
        if(sv.bindings <= 0) {
            console.error('Error: Variable "' + prop + '" not bound!')
            return 'Error: Variable not bound!';
        }
            console.log('VALUE: ');
            console.log(value);
        this.service.io.exec(this.parent.id, this.id, this.index, prop, fn, value);
    }

    unbind(prop: string) {
        let val = this.get(prop);
        val.bindings = 0;
        this.service.io.unbind(this.parent.id, this.id, this.index, prop);
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
}

export class System {
    id: string;
    service: any;
    parent: any;
    modules: Module[] = [];
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

}
