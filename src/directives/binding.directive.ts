/**
 * @Author: Alex Sorafumo
 * @Date:   19/10/2016 10:47 AM
 * @Email:  alex@yuion.net
 * @Filename: binding.directive.ts
 * @Last modified by:   Alex Sorafumo
 * @Last modified time: 03/02/2017 1:08 PM
 */

 import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, Renderer } from '@angular/core';
 import { SystemsService } from '../services';

 import { COMPOSER } from '../settings';

 @Directive({
     selector: '[binding]',
     providers: [ ],
 })
 export class Binding {
     // Bindables
     @Input() public bind: string; // Name of the status variable to bind to
     @Input() public sys: string; // Name of the system to connect to
     @Input() public mod: string; // Name of the module to connect to
     @Input() public index: number; // Index of the named module in the system
     @Input() public value: any; // Value of the status variable bound to
     @Output() public valueChange = new EventEmitter(); // Emits changes to the value variable
     @Input() public exec: string; // Name of the function to execute on the module when value changes
     @Input() public params: any; // Parameters to pass to the called function on module
     @Input() public ignore: number = 0; //

     @Output() public ontap = new EventEmitter();
     @Output() public onpress = new EventEmitter();
     @Output() public onrelease = new EventEmitter();
     // Local Variables
     private id: string = '';
     private started: boolean = false;
     private module_id: string = '';
     private system: any;
     private module: any;
     private binding: any;
     private prev: any = null;
     private prev_exec: any = null;
     private unbind: () => void;
     private service: SystemsService;
     private i: number = 0;
     private ignore_cnt: number = 0;
     private init: boolean = false;
     private debug: boolean = false;

     constructor(private el: ElementRef, private serv: SystemsService, private renderer: Renderer) {
         this.service = serv;
         this.id = (Math.floor(Math.random() * 89999999) + 10000000).toString();
         this.renderer.setElementClass(this.el.nativeElement, `binding-directive-${this.id}`, true);
     }

     public ngOnInit() {
         this.init = false;
     }

     public ngOnChanges(changes: any) {
         if (!this.serv.is_setup) { // Do not update bindings until systems service is ready
             setTimeout(() => {
                 this.ngOnChanges(changes);
             }, 500);
             return;
         }
         // System changes
         if (changes.sys && this.hasChanged('system')) {
             this.cleanModule();
             this.getSystem();
             this.getModule();
             this.getBinding();
         } else if (changes.mod) {  // Module changes
             this.cleanModule();
             if (this.hasChanged('module')) {  // Module changes
                 this.getModule();
                 this.getBinding();
             }
         } else if (changes.index) { // Index changed
             this.cleanModule();
             this.getModule();
             this.getBinding();
         } else if (changes.bind) { // Variable to bind changes
             this.getBinding();
         }
         // Execute () => void changes
         if (this.init && this.prev_exec !== this.exec && this.bind && this.bind !== '') {
             this.ignore_cnt++;
             if (this.ignore_cnt > this.ignore) {
                 COMPOSER.log('Binding', `() => void changed. ${this.prev_exec} => ${this.exec}`);
                 this.call_exec();
             }
         }
         // Binding value changes
         if (this.init && this.binding && this.value !== this.binding.current && this.value !== this.prev) {
             COMPOSER.log('Binding', `Value changed calling exec. ${this.prev} => ${this.value}`);
             this.ignore_cnt++;
             if (this.ignore_cnt > this.ignore) {
                 this.call_exec();
             } else {
                 this.prev = this.value;
             }
         } else if (!this.init) {
             this.prev = this.value;
             this.init = true;
         }
     }

    /**
     * Executes a function on the module
     * @param  {string} exec (Optional) Name of the function to call on the module, defaults to the
     *                       binding name if not set
     * @return {void}
     */
     public call_exec(exec?: string) {
         if (!this || !this.module || this.exec === undefined || (!this.binding && (!this.exec || this.exec === ''))) {
             return;
         }
         if (this.exec === null || this.exec === '') {
             this.exec = this.binding.id;
         }
         // Update binding
         this.prev_exec = this.exec;
         this.prev = this.value;
         COMPOSER.log('Binding', `Calling exec from directive ${this.id}`);
         // Update value to value set by user
         const binding = this.binding ? this.binding.id : '';
         const params = this.params || (!this.bind || this.bind === '') ? this.params : this.value;
         this.module.exec(this.exec, binding, params)
             .then((res: any) => { return; }, (err: any) => { return; });
     }

     private ngOnDestory() {
         if (this.unbind) {
             this.unbind();
             this.unbind = null;
         }
     }

    /**
     * () => void call when the element that this is attached to is tapped
     * emits a ontap event
     * @param  {any}    e Hammer Tap event returned by Angular 2
     * @return {void}
     */
     @HostListener('tap', ['$event'])
     private onClick(e: any) {
         if (e) {
             e.exec = (exec?: string) => { this.call_exec(exec); };
         }
         this.ontap.emit(e);
     }

    /**
     * () => void call when the element that this is attached emits a mouseup/touchend
     * emits an onrelease event
     * @param  {any}    e Hammer PressUp event returned by Angular 2
     * @return {void}
     */
     @HostListener('pressup', ['$event'])
     private onRelease(e: any) {
         if (e) {
             e.exec = (exec?: string) => { this.call_exec(exec); };
         }
         this.onrelease.emit(e);
     }

    /**
     * () => void call when the element that this is attached to is tapped
     * emits a onpress event
     * @param  {any}    e Hammer Press event returned by Angular 2
     * @return {void}
     */
     @HostListener('press', ['$event'])
     private onPress(e: any) {
         if (e) {
             e.exec = (exec?: string) => { this.call_exec(exec); };
         }
         this.onpress.emit(e);
     }

    /**
     * Checks if the element is exists on the page and binds/unbinds from the
     * status variable if neccessary
     * @return {void}
     */
     private checkVisibility() {
         if (!this.checkElement()) {
             if (this.unbind) {
                 this.unbind();
                 this.unbind = null;
             }
         } else {
             if (!this.unbind) {
                 this.getBinding();
             }
         }
     }

    /**
     * Checks if the element attached to the directive is part of the DOM
     * @return {void}
     */
     private checkElement() {
         let el = this.el.nativeElement;
         while (el !== null) {
             if (el.nodeName === 'BODY' || el.nodeName === 'HTML') {
                 return true;
             }
             el = el.parentElement;
         }
         return false;
     }

    /**
     * Cleans up the module string an pulls out the module index if applicable
     * @return {void}
     */
     private cleanModule() {
         const mod = this.mod.split('_');
         const index = mod.pop();
         if (isNaN(+index)) {
             mod.push(index);
             if (!this.index || this.index <= 0) {
                 this.index = 1;
             }
         } else {
             this.index = +index;
         }
         this.module_id = mod.join('_');
     }

    /**
     * Checks if the give type's value has changed
     * @param  {string} type Type to check
     * @return {boolean} Returns whether or not the given type's value has changed
     */
     private hasChanged(type: string) {
         if (type === 'system') {
             return (this.sys && this.sys !== this.system && (typeof this.system !== 'object' ||
                    (this.sys !== this.system.id && this.sys !== '')));
         } else if (type === 'module') {
             return (this.module_id && this.mod !== this.module && (typeof this.module !== 'object' ||
                    (this.module_id !== this.module.id && this.module_id !== '')));
         } else {
             return true;
         }
     }

    /**
     * Gets the system from the Systems Service
     * @return {void}
     */
     private getSystem() {
         if (!this.service) {
             return;
         }
         if (typeof this.sys === 'string') {
             this.system = this.service.get(this.sys);
         } else {
             this.system = this.sys;
         }
     }

    /**
     * Gets the module from the system
     * @return {void}
     */
     private getModule() {
         if (!this.system) {
             return;
         }
         if (typeof this.module_id === 'string') {
             this.module = this.system.get(this.module_id, !this.index && this.index !== 0 ? 1 : +this.index);
         } else {
             this.module = this.module_id;
         }
         if (this.module) {
             this.binding = this.module.get(this.bind);
         }
     }
    /**
     * Gets the status variable from the module and binds to it.
     * @return {void}
     */
     private getBinding() {
         if (!this.bind || this.bind === '' || !this.module) {
             return;
         }
         if (this.unbind !== undefined && this.unbind !== null) {
             this.unbind();
         }
         this.binding = this.module.get(this.bind);
         this.unbind = this.module.bind(this.bind, (curr: any, prev: any) => {
             // Changes to local value
             this.valueChange.emit(curr);
         });
         this.value = this.binding.current;
         this.prev = this.value;
         const msg = `Binding to '${this.binding.id}' on ${this.system.id}, ${this.module.id} ${this.module.index}`;
         COMPOSER.log('Binding', msg);
         if (this.unbind === null) {
             setTimeout(() => {
                 this.getBinding();
             }, 200);
         }
     }

 }
