/**
 * @Author: Alex Sorafumo
 * @Date:   19/10/2016 10:47 AM
 * @Email:  alex@yuion.net
 * @Filename: debug.directive.ts
 * @Last modified by:   Alex Sorafumo
 * @Last modified time: 15/12/2016 11:42 AM
 */

import { Directive, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { SystemsService } from '../services/systems/systems.service';
import { EngineSystem, EngineModule } from '../services/systems/classes';


@Directive({
    selector: '[debug]',
    providers: [],
})
export class DebugDirective {
    @Input() public sys: string;
    @Input() public mod: string;
    @Input() public index: number;
    @Input() public enabled: boolean = true;
    @Input() public output: any;
    @Input() public numLines: number;
    @Output() public outputChange = new EventEmitter(); // an event emitter

    private system: EngineSystem;
    private module: EngineModule;
    private msgs: string[] = [];
    private change = false;
    private months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    constructor(private service: SystemsService) {
        this.msgs = [];
    }

    public ngOnChanges(changes: SimpleChanges) {
        this.change = true;
        // System changes
        if (this.sys !== this.system.id && (typeof this.system !== 'object' || this.sys !== this.system.id)) {
            this.getSystem();
            this.getModule();
        }
        // Module changes
        if (this.mod !== this.module.id && (typeof this.module !== 'object' || this.mod !== this.module.id)) {
            this.getModule();
        }
        if (this.msgs !== this.output) {
            this.msgs = this.output;
        }
        // Limit number of lines to store in the array.
        if (this.numLines && this.msgs.length > this.numLines) {
            this.msgs.splice(this.numLines, this.msgs.length - this.numLines);
        }
        this.change = false;
    }

    public time() {
        return '';
    }

    public addMessage(msg: string) {
        if (!this.msgs) {
            this.msgs = [];
        }
        this.msgs.splice(0, 0, this.time() + ' - ' + msg);
        // Limit number of lines to store in the array.
        if (this.numLines && this.msgs.length > this.numLines) {
            this.msgs.splice(this.numLines, this.msgs.length - this.numLines);
        }
        this.outputChange.emit(this.msgs);
    }

    private getSystem() {
        if (typeof this.sys === 'string') {
            this.system = this.service.get(this.sys);
        } else {
            this.system = this.sys;
        }
    }

    private getModule() {
        if (typeof this.mod === 'string') {
            this.module = this.system.get(this.mod, this.index ? this.index : 1);
        } else {
            this.module = this.mod;
        }
        this.module.setDebug(this);
    }
}
