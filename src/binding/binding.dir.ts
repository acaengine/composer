import { Directive, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { SystemsService } from '../systems-service';

@Directive({
    selector: '[binding]',
    providers: [SystemsService]
})
export class Binding {
    @Input() bind: any;
    @Input() sys: any;
    @Input() mod: any;
    @Input() value: any;
    @Output() change = new EventEmitter(); // an event emitter
    @Input() exec: any;
    @Input() params: any;
    @Input() index: number;
    system: any;
    module: any;
    binding: any;
    prev_exec: any;
    unbind : Function;

    service: SystemsService;
    constructor(serv?: SystemsService){
        this.service = serv;
        setInterval(() => {
                // Update value to value set by user
            this.module.exec(this.exec, this.binding.id, !this.value);
        }, 5000);
    }

    ngAfterContentInit(){
        console.log('After Init');
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
            // Update binding
        if(this.exec === null || this.exec === ''){
            this.exec = '$' + this.binding.id;
            this.call_exec();
        } else if(this.exec === undefined) this.exec = '$' + this.binding.id;
    }

    ngOnChanges(changes: any) {
            // Execute Function Changed
        if(this.prev_exec !== this.exec){
            console.log('New exec function.');
            this.call_exec();
        }
            // System changed
        if(this.sys !== this.system && (typeof this.system !== 'object' || this.sys !== this.system.id)) {
            console.log('Changed System to ' + this.sys + '.');
            this.getSystem();
            this.getModule();
            this.getBinding();
        }
            // Module Changed
        if(this.mod !== this.module && (typeof this.module !== 'object' || this.mod !== this.module.id)) {
            console.log('Changed Module to ' + this.mod + ' ' + (this.index ? this.index : 1) + '.');
            this.getModule();
            this.getBinding();
        }
            // Binding value changed
        if(this.binding && this.value !== this.binding.current && this.exec !== undefined){
            console.log('Updating Value');
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
        console.log('Getting Binding.');
        if(this.unbind) this.unbind();
        this.binding = this.module.get(this.bind);
        this.unbind = this.module.bind(this.bind, (curr: any, prev: any) => {
            console.log(curr);
                //Update local value
            if(this.value != curr) {
                this.change.emit(curr);
                this.value = curr;
            }
        });
    }

    private call_exec(){
        this.prev_exec = this.exec;
            // Update value to value set by user
        this.module.exec(this.exec, this.binding.id, this.value);
    }

}
