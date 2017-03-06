/**
* @Author: Alex Sorafumo
* @Date:   19/10/2016 10:47 AM
* @Email:  alex@yuion.net
* @Filename: binding.directive.ts
* @Last modified by:   Alex Sorafumo
* @Last modified time: 03/02/2017 1:08 PM
*/

import { Directive, ElementRef, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { SystemsService } from '../services';

@Directive({
    selector: '[binding]',
    providers: [ ]
})
export class Binding {
        // Bindables
    @Input() bind: string; // Name of the status variable to bind to
    @Input() sys: string; // Name of the system to connect to
    @Input() mod: string; // Name of the module to connect to
    @Input() index: number; // Index of the named module in the system
    @Input() value: any; // Value of the status variable bound to
    @Output() valueChange = new EventEmitter(); // Emits changes to the value variable
    @Input() exec: string; // Name of the function to execute on the module when value changes
    @Input() params: any; // Parameters to pass to the called function on module
    @Input() ignore: number = 0; // 

    @Output() ontap = new EventEmitter();
    @Output() onpress = new EventEmitter();
    @Output() onrelease = new EventEmitter();
        // Local Variables
    id: string = '';
    started: boolean = false;
    module_id: string = '';
    system: any;
    module: any;
    binding: any;
    prev: any;
    prev_exec: any;
    unbind : Function;
    service: SystemsService;
    i: number = 0;
    ignore_cnt: number = 0;

    /**
     * Function call when the element that this is attached to is tapped
     * emits a ontap event
     * @param  {any}    e Hammer Tap event returned by Angular 2
     * @return {void}
     */
    @HostListener('tap', ['$event'])
    onClick(e: any) {
        if(e) {
            e.exec = (exec?: string) => { this.call_exec(exec); };
        }
        this.ontap.emit(e);
    }

    /**
     * Function call when the element that this is attached emits a mouseup/touchend
     * emits an onrelease event
     * @param  {any}    e Hammer PressUp event returned by Angular 2
     * @return {void}
     */
    @HostListener('pressup', ['$event'])
    onRelease(e: any) {
        if(e) {
            e.exec = (exec?: string) => { this.call_exec(exec); };
        }
        this.onrelease.emit(e);
    }

    /**
     * Function call when the element that this is attached to is tapped
     * emits a onpress event
     * @param  {any}    e Hammer Press event returned by Angular 2
     * @return {void}
     */
    @HostListener('press', ['$event'])
    onPress(e: any) {
        if(e) {
            e.exec = (exec?: string) => { this.call_exec(exec); };
        }
        this.onpress.emit(e);
    }

    constructor(private el: ElementRef, private serv: SystemsService){
        this.service = serv;
        this.id = (Math.floor(Math.random() * 89999999) + 10000000).toString();
        this.el.nativeElement.classList.add(`binding-directive-${this.id}`);
        /*
        setInterval(() => {
            this.checkVisibility();
        }, 50);
        //*/
    }
    /**
     * Checks if the element is exists on the page and binds/unbinds from the
     * status variable if neccessary
     * @return {void}
     */
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

    /**
     * Checks if the element attached to the directive is part of the DOM
     * @return {void}
     */
    checkElement() {
        let el = this.el.nativeElement;
        while(el !== null){
            if(el.nodeName === 'BODY' || el.nodeName === 'HTML') return true;
            el = el.parentElement;
        }
        return false;
    }

    ngOnChanges(changes: any) {
        if(!this.serv.is_setup) { // Do not update bindings until systems service is ready
            setTimeout(() => {
                this.ngOnChanges(changes);
            }, 500);
            return;
        }
            // Execute Function changes
        if(this.prev_exec !== this.exec && this.bind && this.bind !== ''){
            this.ignore_cnt++
            if(this.ignore_cnt > this.ignore){
                if(window['debug']) {
                    console.debug(`[COMPOSER][Binding] Function changed. ${this.prev_exec} => ${this.exec}`);
                }
                this.call_exec();
            }
        }
            // System changes
        if(changes.sys && this.hasChanged('system')) {
            this.cleanModule();
            this.getSystem();
            this.getModule();
            this.getBinding();
        } else if(changes.mod) {  // Module changes
            this.cleanModule();
            if(this.hasChanged('module')) {  // Module changes
                this.getModule();
                this.getBinding();
            } 
        } else if(changes.index) {              //Index changed
            this.cleanModule();
            this.getModule();
            this.getBinding();
        } else if(changes.bind) {               // Variable to bind changes
            this.getBinding();
        }
            // Binding value changes
        if(this.binding && this.value !== this.binding.current && this.value !== this.prev){
            if(window['debug']) {
                console.debug(`[COMPOSER][Binding] Value changed calling exec. ${this.prev} => ${this.value}`);
            }
            this.ignore_cnt++;
            if(this.ignore_cnt > this.ignore){
                this.call_exec();
            } else {
                this.prev = this.value
            }
        }
        //if(changes.value) this.valueChange.emit(changes.value.currentValue);
    }
    /**
     * Cleans up the module string an pulls out the module index if applicable
     * @return {void}
     */
    cleanModule() {
        let mod = this.mod.split('_');
        let index = mod.pop();
        if(isNaN(+index)) {
            mod.push(index);
            if(!this.index || this.index <= 0) this.index = 1;
        } else this.index = +index;
        this.module_id = mod.join('_');
    }
    /**
     * Checks if the give type's value has changed
     * @param  {string} type Type to check
     * @return {boolean} Returns whether or not the given type's value has changed
     */
    hasChanged(type: string) {
        if(type === 'system') {
            return (this.sys && this.sys !== this.system && (typeof this.system !== 'object' || (this.sys !== this.system.id && this.sys !== '')));
        } else if(type === 'module') {
            return (this.module_id && this.mod !== this.module && (typeof this.module !== 'object' || (this.module_id !== this.module.id && this.module_id !== '')));
        } else {
            return true;
        }
    }

    /**
     * Gets the system from the Systems Service
     * @return {void}
     */
    private getSystem(){
        if(!this.service) return;
        if(typeof this.sys === 'string') this.system = this.service.get(this.sys);
        else this.system = this.sys;
    }

    /**
     * Gets the module from the system
     * @return {void}
     */
    private getModule(){
        if(!this.system) return;
        if(typeof this.module_id === 'string') this.module = this.system.get(this.module_id, !this.index && this.index !== 0 ? 1 : +this.index);
        else this.module = this.module_id;
        if(this.module){
            this.binding = this.module.get(this.bind);
        }
    }
    /**
     * Gets the status variable from the module and binds to it.
     * @return {void}
     */
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
        if(window['debug']) console.debug(`[COMPOSER][Binding] Binding to '${this.binding.id}' on ${this.system.id}, ${this.module.id} ${this.module.index}`);
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

    /**
     * Executes a function on the module
     * @param  {string} exec (Optional) Name of the function to call on the module, defaults to the binding name if not set
     * @return {void}
     */
    private call_exec(exec?: string){
        if(!this || !this.module || this.exec === undefined || (!this.binding && (!this.exec || this.exec === ''))) return;
        if(this.exec === null || this.exec === '') this.exec = this.binding.id;
            // Update binding
        this.prev_exec = this.exec;
        this.prev = this.value;
        if(window['debug']) console.debug(`[COMPOSER][Binding] Calling exec from directive ${this.id}`);
            // Update value to value set by user
        this.module.exec(this.exec, this.binding ? this.binding.id : '', this.params || (!this.bind || this.bind === '') ? this.params : this.value);
    }

}
