import { Directive, Input, Output, EventEmitter } from '@angular/core';
import { SystemsService } from '../services';

@Directive({
    selector: '[debug]',
    providers: [ ]
})
export class Debug {
    @Input() sys: any;
    @Input() mod: any;
    @Input() index: number;
    @Input() enabled: boolean = true;
    @Input() output: any;
    @Input() numLines: number;
    @Output() outputChange = new EventEmitter(); // an event emitter
    system: any;
    module: any;
    msgs: string[] = [];
    change = false;

    service: SystemsService;
    constructor(serv?: SystemsService){
        this.service = serv;
        this.msgs = [];
    }

    ngOnChanges(changes: any) {
        this.change = true;
            // System changes
        if(this.sys !== this.system && (typeof this.system !== 'object' || this.sys !== this.system.id)) {
            this.getSystem();
            this.getModule();
        }
            // Module changes
        if(this.mod !== this.module && (typeof this.module !== 'object' || this.mod !== this.module.id)) {
            this.getModule();
        }
        if(this.msgs !== this.output) this.msgs = this.output;
            // Limit number of lines to store in the array.
        if(this.numLines && this.msgs.length > this.numLines) this.msgs.splice(this.numLines, this.msgs.length - this.numLines);
        this.change = false;
    }

    private getSystem(){
        if(typeof this.sys === 'string') this.system = this.service.get(this.sys);
        else this.system = this.sys;
    }

    private getModule(){
        if(typeof this.mod === 'string') this.module = this.system.get(this.mod, this.index ? this.index : 1);
        else this.module = this.mod;
        this.module.setDebug(this);
    }

    addMessage(msg: string){
        if(!this.msgs) this.msgs = [];
        this.msgs.splice(0, 0, this.time() + ' - ' + msg);
        console.debug(this.time() + ' - ' + msg);
            // Limit number of lines to store in the array.
        if(this.numLines && this.msgs.length > this.numLines) this.msgs.splice(this.numLines, this.msgs.length - this.numLines);
        this.outputChange.emit(this.msgs);
    }

    private months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    time() {
        return this.module.now;
    }
}
