/**
* @Author: Alex Sorafumo
* @Date:   19/10/2016 10:47 AM
* @Email:  alex@yuion.net
* @Filename: binding.directive.ts
* @Last modified by:   alex.sorafumo
* @Last modified time: 14/01/2017 9:25 AM
*/

import { Directive, ElementRef, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { SystemsService } from '../services';

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

    @Output() ontap = new EventEmitter();
    @Output() onpress = new EventEmitter();
    @Output() onrelease = new EventEmitter();
    system: any;
    module: any;
    binding: any;
    prev: any;
    prev_exec: any;
    unbind : Function;
    service: SystemsService;
    i: number = 0;

    @HostListener('tap', ['$event'])
    onClick(e: any) {
        if(e) {
            e.exec = (exec?: string) => { this.call_exec(exec); };
        }
        this.ontap.emit(e);
    }

    @HostListener('pressup', ['$event'])
    onRelease(e: any) {
        if(e) {
            e.exec = (exec?: string) => { this.call_exec(exec); };
        }
        this.onrelease.emit(e);
    }

    @HostListener('press', ['$event'])
    onPress(e: any) {
        if(e) {
            e.exec = (exec?: string) => { this.call_exec(exec); };
        }
        this.onpress.emit(e);
    }

    constructor(private el: ElementRef, private serv: SystemsService){
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
        if(!this.serv.is_setup) {
            setTimeout(() => {
                this.ngOnChanges(changes);
            }, 500);
            return;
        }
            // Execute Function changes
        if(this.prev_exec !== this.exec && this.bind && this.bind !== ''){
            this.call_exec();
        }
            // System changes
        if(this.sys && this.sys !== this.system && (typeof this.system !== 'object' || (this.sys !== this.system.id && this.sys !== ''))) {
            this.getSystem();
            this.getModule();
            this.getBinding();
        }
            // Module changes
        if((this.mod && this.mod !== this.module && (typeof this.module !== 'object' || (this.mod !== this.module.id && this.mod !== '')))) {
            this.getModule();
            this.getBinding();
        }
            //Index changed
        if(changes.index) {
            this.getModule();
            this.getBinding();
        }
            // Binding value changes
        if(this.binding && this.value !== this.binding.current && this.value !== this.prev){
            if(window['debug']) {
                console.debug(`[COMPOSER][Binding] Value changed calling exec. ${this.prev} => ${this.value}`);
            }
            this.call_exec();
        }
        if(changes.value) this.valueChange.emit(changes.value.currentValue);
    }

    private getSystem(){
        if(!this.service) return;
        if(typeof this.sys === 'string') this.system = this.service.get(this.sys);
        else this.system = this.sys;
    }

    private getModule(){
        if(!this.system) return;
        if(typeof this.mod === 'string') this.module = this.system.get(this.mod, !this.index && this.index !== 0 ? 1 : +this.index);
        else this.module = this.mod;
        this.binding = this.module.get(this.bind);
    }

    private getBinding(){
        if(!this.bind || this.bind === '' || !this.module) return;
        if(this.unbind !== undefined && this.unbind !== null) this.unbind();
        this.binding = this.module.get(this.bind);
        this.unbind = this.module.bind(this.bind, (curr: any, prev: any) => {
                //changes local value
            this.valueChange.emit(curr)
        });
        this.value = this.binding.current;
        this.prev = this.value;
        if(window['debug']) console.debug(`[COMPOSER][Binding] Bound to '${this.binding.id}' on ${this.system.id}, ${this.module.id} ${this.module.index}`);
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

    private call_exec(exec?: string){
        if(!this || this.exec === undefined || (!this.binding && (!this.exec || this.exec === ''))) return;
        if(this.exec === null || this.exec === '') this.exec = this.binding.id;
            // Update binding
        this.prev_exec = this.exec;
        this.prev = this.value;
            // Update value to value set by user
        this.module.exec(this.exec, this.binding ? this.binding.id : '', this.params || (!this.bind || this.bind === '') ? this.params : this.value);
    }

}
