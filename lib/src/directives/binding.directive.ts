/**
 * @Author: Alex Sorafumo
 * @Date:   19/10/2016 10:47 AM
 * @Email:  alex@yuion.net
 * @Filename: binding.directive.ts
 * @Last modified by:   Alex Sorafumo
 * @Last modified time: 03/02/2017 1:08 PM
 */

import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2 } from '@angular/core';
import { ChangeDetectorRef, OnChanges, OnDestroy, OnInit } from '@angular/core';

import { COMPOSER } from '../settings';
import { SystemsService } from '../services/systems/systems.service';


@Directive({
    selector: '[binding]',
})
export class BindingDirective implements OnChanges, OnDestroy, OnInit {
    // Bindables
    @Input() public bind: string; // Name of the status variable to bind to
    @Input() public sys: string; // Name of the system to connect to
    @Input() public mod: string; // Name of the module to connect to
    @Input() public index: number; // Index of the named module in the system
    @Input() public value: any; // Value of the status variable bound to
    @Input() public exec: string; // Name of the function to execute on the module when value changes
    @Input() public params: any; // Parameters to pass to the called function on module
    @Input() public ignore: number = 0; // Number of execute requests to ignore

    @Output() public valueChange = new EventEmitter(); // Emits changes to the value variable
    @Output() public ignoreChange = new EventEmitter(); // Emits when ignores occur
    // Input Event Emitters
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
    private unbind: () => void;
    private i: number = 0;
    private init: boolean = false;
    private debug: boolean = false;

    constructor(private el: ElementRef, private service: SystemsService, private renderer: Renderer2, private _cdr: ChangeDetectorRef) {
        this.id = (Math.floor(Math.random() * 899999) + 100000).toString();
        this.renderer.addClass(this.el.nativeElement, `binding-directive-${this.id}`);
    }

    public ngOnInit() {
        this.init = false;
    }

    public ngOnChanges(changes: any) {
        if (!this.service.is_setup) { // Do not update bindings until systems service is ready
            return setTimeout(() => this.ngOnChanges(changes), 500);
        }
        // System changes
        if (changes.sys && this.hasChanged('system')) {
            this.cleanModule();
            this.getSystem();
        } else if (changes.mod) {  // Module changes
            this.cleanModule();
            if (this.hasChanged('module')) {  // Module changes
                this.getModule();
            }
        } else if (changes.index) { // Index changed
            this.cleanModule();
            this.getModule();
        } else if (changes.bind) { // Variable to bind changes
            this.getBinding();
        }
        if (this.init) {
            const old_value = this.binding ? this.binding.value() : (changes.value ? changes.value.previous : null);
            const change_in_value = this.value !== (old_value);
                // Bindings local value has change
            if (this.binding && change_in_value) {
                this.binding.setValue(this.value, true);
            }
                // Execute function has changed
            if (changes.exec || change_in_value) {
                this.call(changes.exec ? changes.exec.previous : '');
            }
        } else if (!this.init) {
            // Initialized local binding value
            setTimeout(() => this.init = true, 100);
        }
    }

    public ngOnDestroy() {
        if (this.unbind) {
            this.unbind();
            this.unbind = null;
        }
    }

    public call(old?: string) {
        if (this.ignore <= 0) {
            COMPOSER.log('BIND(D)', `${this.id}: Execute function changed. ${old} → ${this.exec}`);
            this.call_exec();
        } else {
            this.ignore--;
            this.ignoreChange.emit(this.ignore);
        }
    }

    /**
     * Executes a function on the module
     * @param  {string} exec (Optional) Name of the function to call on the module, defaults to the
     *                       binding name if not set
     * @return {void}
     */
    public call_exec(exec?: string) {
        if (this.binding && (this.exec === null || this.exec === '')) {
            this.exec = this.binding.id;
        }
        if (!this.module || !this.exec) {
            return;
        }
        const bind_info = `${this.sys}, ${this.mod}, ${this.bind || 'No binding'}`;
        COMPOSER.log('BIND(D)', `${this.id}: Calling exec from directive: ${bind_info}`);
        // Update value to value set by user
        const params = this.params ? this.params : (this.bind ? this.value : null);
        this.module.exec(this.exec, params).then((res: any) => null, (err: any) => null);
    }

    private ngOnDestory() {
        if (this.unbind) {
            this.unbind();
            this.unbind = null;
        }
    }

    private emit(e, emitter) {
        if (e) {
            e.exec = (exec?: string) => { this.call_exec(exec); };
        }
        emitter.emit(e);
    }

    /**
     * () => void call when the element that this is attached to is tapped
     * emits a ontap event
     * @param  {any}    e Hammer Tap event returned by Angular 2
     * @return {void}
     */
    @HostListener('tap', ['$event'])
    private onClick(e: any) { this.emit(e, this.ontap); }

    /**
     * () => void call when the element that this is attached emits a mouseup/touchend
     * emits an onrelease event
     * @param  {any}    e Hammer PressUp event returned by Angular 2
     * @return {void}
     */
    @HostListener('pressup', ['$event'])
    private onRelease(e: any) { this.emit(e, this.onrelease); }

    /**
     * () => void call when the element that this is attached to is tapped
     * emits a onpress event
     * @param  {any}    e Hammer Press event returned by Angular 2
     * @return {void}
     */
    @HostListener('press', ['$event'])
    private onPress(e: any) { this.emit(e, this.onpress); }

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
        if (this.mod) {
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
        if (!this.service) { return; }
        if (typeof this.sys === 'string') {
            this.system = this.service.get(this.sys);
        } else {
            this.system = this.sys;
        }
        this.getModule();
    }

    /**
     * Gets the module from the system
     * @return {void}
     */
    private getModule() {
        if (!this.system) { return; }
        if (typeof this.module_id === 'string') {
            this.module = this.system.get(this.module_id, !this.index && this.index !== 0 ? 1 : +this.index);
        } else {
            this.module = this.module_id;
        }
        this.getBinding();
    }
    /**
     * Gets the status variable from the module and binds to it.
     * @return {void}
     */
    private getBinding() {
        if (!this.bind || !this.module) { return; }
        if (this.unbind instanceof Function) {
            this.unbind();
            this.unbind = null;
        }
        this.binding = this.module.get(this.bind);
        this.module.bind(this.bind, (change: any) => {
            setTimeout(() => {
                    // Changes to local value
                this.value = this.binding.value();
                this.valueChange.emit(this.value);
                this._cdr.markForCheck();
            }, 10);
        }).then((unbind) => {
            this.unbind = unbind;
            this.value = this.binding.current;
            const msg = `${this.id}: Bound to '${this.bind}' on ${this.sys}, ${this.module.id} ${this.module.index}`;
            COMPOSER.log('BIND(D)', msg);
            if (this.unbind === null) {
                setTimeout(() => this.getBinding(), 200);
            }
        }, () => null);
    }

}
