
class ComposerObject {
  id : string;
  service : Object;
  parent : Object;
}

class StatusVariable extends ComposerObject {
  previous = null;
  current = null;
  callbacks = [];
  bindings : number = 0;
  value = {}
  constructor(srv : Object, parent : Object, name : string, init_val){
      this.id = name;
      this.previous = init_val;
      this.current = init_val;
      this.module = mod;
      this.value = {
        system_id : this.parent.parent.id,
        module_name : this.parent.id,
        module_index : this.parent.index,
        name = this.name;
      }
  }

  success(msg){

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
  status_variables : StatusVariable[];
  constructor(srv : Object, parent : Object, name : string, i : number){
    this.id = name
    this.service = srv;
    this.module = mod;
    this.index = i;
  }
  bind(prop : string){
    this.service.bind(this.parent.id, this.id, this.index, prop);
  }

  exec(prop : string, fn : string, value : any){
    var ids = {
      system_id : this.parent.id,
      module_name : this.id,
      module_index : this.index,
      name = prop;
    }
    this.service.exec(this.parent.id, this.id, this.index, prop, fn, value);
  }
}

export class System extends ComposerObject {
  modules : Module[];
  constructor(srv : Object, sys_id : string){
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
      modules.push(module);
    }
    return module;
  }

}
