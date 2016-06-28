
class ComposerObject {
    id : string;
    service : any;
    parent : any;
}

class StatusVariable extends ComposerObject {
    previous = null;
    current = null;
    callbacks = [];
    bindings : number = 0;
    value = {}
    constructor(srv : Object, parent, name : string, init_val){
        super();
        this.id = name;
        this.previous = init_val;
        this.current = init_val;
        this.parent = parent;
        this.value = {
            system_id : this.parent.parent.id,
            module_name : this.parent.id,
            module_index : this.parent.index,
            name : this.id
        }
    }

    success(msg){
        console.log(msg);
        if(msg.meta.cmd == 'exec'){
            this.previous = this.current;
            this.current = msg.meta.args;
        }
    }

    error(msg){

    }

    notify(msg){
        this.previous = this.current;
        this.current = msg.value;
    }

    update(params){

    }
}

class Module extends ComposerObject{
    index : number = 0;
    status_variables : StatusVariable[] = [];
    constructor(srv : Object, parent, name : string, i : number){
        super();
        this.id = name
        this.service = srv;
        this.parent = parent;
        this.index = i;
    }
    bind(prop : string){
        this.service.io.bind(this.parent.id, this.id, this.index, prop);
        var val = this.get(prop);
        val.bindings++;
    }

    exec(fn : string, prop : string, value : any){
        console.log('Perform Exec');
        var ids = {
            system_id : this.parent.id,
            module_name : this.id,
            module_index : this.index,
            name : prop
        }
        this.get(prop);
        this.service.io.exec(this.parent.id, this.id, this.index, prop, fn, value);
    }

    unbind(prop : string){
        var val = this.get(prop);
        val.bindings--;
        this.service.io.unbind(this.parent.id, this.id, this.index, prop);
    }

    get(prop: string){
        for(var i = 0; i < this.status_variables.length; i++){
            if(this.status_variables[i].id == prop){
                return this.status_variables[i];
            }
        }
        var s_var = new StatusVariable(this.service, this, prop, 0);
        this.status_variables.push(s_var);
        return s_var;
    }
}

export class System extends ComposerObject {
    modules : Module[] = [];
    constructor(srv : Object, sys_id : string){
        super();
        this.service = srv;
        this.parent = srv;
        this.id = sys_id;
    }

    get(mod_id : string, index : number = 1){
        var module = null;
        //Check if system already exists
        for(var i = 0; i < this.modules.length; i++){
            if(this.modules[i].id == mod_id){
                module = this.modules[i];
            }
        }
        if(module === null) {
            //System not stored create new one.
            module = new Module(this.service, this, mod_id, index);
            this.modules.push(module);
        }
        return module;
    }

}
