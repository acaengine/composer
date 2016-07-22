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
    i: number = 0;

    constructor(private el: ElementRef, serv?: SystemsService){
        this.service = serv;
        /*
        setInterval(() => {
            this.checkVisibility();
        }, 50);
        //*/
    }
    //*
    checkVisibility() {
        if(!this.checkElement()){
            if(this.unbind) {
                this.unbind();
                this.unbind = null;
            }
        } else {
            if(!this.unbind) this.getBinding();
        }
    }
    //*/

    checkElement() {
        let el = this.el.nativeElement;
        while(el !== null){
            if(el.nodeName === 'BODY' || el.nodeName === 'HTML') return true;
            el = el.parentElement;
        }
        return false;
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
        if(changes.value) this.valueChange.emit(changes.value.currentValue);
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
    }

    ngOnDestory() {
        if(this.unbind) {
            this.unbind();
            this.unbind = null;
        }
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
