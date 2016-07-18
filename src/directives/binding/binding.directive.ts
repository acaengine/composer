import { Directive, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { SystemsService } from '../../services/systems-service';

@Directive({
    selector: '[binding]',
    providers: [ ]
})
export class Binding {
    @Input() bind: any;
    @Input() sys: any;
    @Input() mod: any;
    @Input() value: any;
    @Output() valueChange = new EventEmitter(); // an event emitter
    @Input() exec: any;
    @Input() params: any;
    @Input() index: number;
    system: any;
    module: any;
    binding: any;
    prev: any;
    prev_exec: any;
    unbind : Function;

    service: SystemsService;
    constructor(serv?: SystemsService){
        this.service = serv;
    }

    ngAfterContentInit(){
            // Load Binding
        if(typeof this.mod === 'object'){
            this.module = this.mod;
            this.system = this.module.parent;
        } if (typeof this.sys === 'object') {
            this.system = this.sys;
            this.module = this.system.get(this.mod, this.index ? this.index : 1);
        } else {
            this.system = this.service.get(this.sys);
            this.module = this.system.get(this.mod, this.index ? this.index : 1);
        }
        this.getBinding();
    }

    ngOnChanges(changes: any) {
            // Execute Function changes
        if(this.prev_exec !== this.exec){
            this.call_exec();
        }
            // System changes
        if(this.sys !== this.system && (typeof this.system !== 'object' || this.sys !== this.system.id)) {
            this.getSystem();
            this.getModule();
            this.getBinding();
        }
            // Module changes
        if(this.mod !== this.module && (typeof this.module !== 'object' || this.mod !== this.module.id)) {
            this.getModule();
            this.getBinding();
        }
            // Binding value changes
        if(this.binding && this.value !== this.binding.current && this.value !== this.prev){
            this.call_exec();
        }
    }

    private getSystem(){
        if(typeof this.sys === 'string') this.system = this.service.get(this.sys);
        else this.system = this.sys;
    }

    private getModule(){
        if(typeof this.mod === 'string') this.module = this.system.get(this.mod, this.index ? this.index : 1);
        else this.module = this.mod;
        this.binding = this.module.get(this.bind);
    }

    private getBinding(){
        if(this.unbind !== undefined && this.unbind !== null) this.unbind();
        this.binding = this.module.get(this.bind);
        this.unbind = this.module.bind(this.bind, (curr: any, prev: any) => {
                //changes local value
            this.valueChange.emit(curr)
        });
        this.value = this.binding.current;
        this.prev = this.value;
        if(this.unbind === null) {
            setTimeout(() => {
                this.getBinding();
            }, 200);
        }
        //this.valueChange.emit(this.binding.current);
    }

    private call_exec(){
        if(!this || this.exec === undefined || !this.binding) return;
        if(this.exec === null || this.exec === '') this.exec = this.binding.id;
            // Update binding
        this.prev_exec = this.exec;
            // Update value to value set by user
        this.module.exec(this.exec, this.binding.id, this.params ? this.params : this.value);
    }

}
