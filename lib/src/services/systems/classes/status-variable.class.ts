/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-02 10:49:31
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-02 11:09:19
 */

import { BehaviorSubject } from 'rxjs';
import { EngineModule } from './module.class';

import { COMPOSER } from '../../../settings';

const EXEC_LIMIT = 10;
const EXEC_TIME_DELAY = 100;

export class EngineStatusVariable {
    public id: string;           // Name of status variable
    public parent: EngineModule; // Module connected to status variable
    public model: any = {};
    private service: any;           // System service
    private promises: any = {};
    private timers: any = {};
    private subjects: any = {};
    private observers: any = {};

    constructor(srv: object, parent: any, name: string, init_val?: any) {
        this.id = name;
        this.service = srv;
        this.parent = parent;
        this.model = {
            system_id: this.parent.parent.id,
            module_name: this.parent.id,
            module_index: this.parent.index,
            name: this.id,
        };
            // Create behavior subject for binding count
        this.subjects.bindings = new BehaviorSubject(0);
        this.observers.bindings = this.subjects.bindings.asObservable();
            // Create behavior subject for status variable value
        this.subjects.value = new BehaviorSubject<any>(init_val || null);
        this.observers.value = this.subjects.value.asObservable();
            // Create behavior subject for previous status variable value
        this.subjects.previous = new BehaviorSubject<any>(null);
        this.observers.previous = this.subjects.previous.asObservable();
            // Create behavior subject for previous status variable value
        this.subjects.changed = new BehaviorSubject(false);
        this.observers.changed = this.subjects.changed.asObservable();
    }

    get current() {
        return this.value();
    }

    public setValue(value: any, local: boolean = false) {
        const previous = this.value('previous');
        this.subjects.value.next(value);
        if (!local) {
            this.subjects.previous.next(this.value());
            this.subjects.changed.next(!this.value('change'));
        } else {
            COMPOSER.log('STATUS', `Local value changed calling exec(${this.binding}). ${previous} → ${value}`);
            this.exec();
        }
    }

    get binding() {
        const module = this.parent;
        const system = module.parent;
        return `${system.id}, ${module.id} ${module.index}, ${this.id}`
    }

    public count() {
        return this.value('bindings');
    }

    public bind(next: (value: any) => void) {
        return new Promise((resolve, reject) => {
            const mod = `${this.parent.id} ${this.parent.index}`;
            const msg = `Binding to '${this.id}' on ${this.parent.parent.id}, ${mod}`;
            COMPOSER.log('STATUS', msg);
            if (this.value('bindings') <= 0) {
                const module = this.parent;
                const system = module.parent;
                this.service.io.bind(system.id, module.id, module.index, this.id).then(() => {
                    COMPOSER.log('STATUS', `Bound to '${this.id}' on ${this.parent.parent.id}, ${mod}`, this.value());
                    resolve(() => { this.unbind() });
                }, (err) => {
                    COMPOSER.error('STATUS', 'Binding to status variable failed.', err);
                    reject(err);
                });
            }
            this.subjects.bindings.next(this.value('bindings') + 1);
            this.listen('changed', next);
        });
    }

    public rebind() {
        if (this.value('bindings') > 0) {
            const module = this.parent;
            const system = module.parent;
            COMPOSER.log('STATUS', `Rebinding to ${this.id} on ${system.id}, ${module.id} ${module.index}`);
            this.service.io.bind(system.id, module.id, module.index, this.id).then(() => {
                COMPOSER.log('STATUS', `Rebound to ${this.id} on ${system.id}, ${module.id} ${module.index}`, this.value());
            }, (err) => COMPOSER.error('STATUS', 'Binding to status variable failed.', err));
        }
    }

    public listen(name: string, next: (value: any) => void) {
        if (this.subjects[name]) {
            return this.observers[name].subscribe(next);
        }
        return null;
    }

    public value(name: string = 'value') {
        if (this.subjects[name]) {
            return this.subjects[name].getValue();
        }
        return null;
    }

    public update(params: any) {
        return;
    }
    /**
     * Unbind from this variable
     * @return
     */
    public unbind() {
        const count = this.value('bindings');
        if (count === 1) {
            const module = this.parent;
            const system = module.parent;
            this.subjects.bindings.next(count - 1);
            this.service.io.unbind(system.id, module.id, module.index, this.id).then(() => {
                this.subjects.bindings.next(0);
                COMPOSER.log('STATUS', `Unbound binding(${this.binding}). 0 remaining.`);
            }, (err) => {
                COMPOSER.error('VAR', 'Unbinding from status variable failed.', err);
                this.subjects.bindings.next((this.value('bindings') || 0) + 1);
            });
        } else if (count > 1) {
            this.subjects.bindings.next(count - 1);
            COMPOSER.log('STATUS', `Unbound binding(${this.binding}). ${count - 1} remaining.`);
        }
    }

    /**
     * Called when an execute returns success
     * @param msg Message returned by the server
     * @return
     */
    public success(msg: any) {
        return;
    }

    /**
     * Called when an execute returns error
     * @param msg Message returned by the server
     * @return
     */
    public error(msg: any) {
        return;
    }

    /**
     * Called when an status variable is updated on the server side
     * @param msg Message returned by the server
     * @return
     */
    public notify(msg: any) {
        this.setValue(msg.value);
        this.promises.exec = null;
    }

    private exec() {
        if (!this.promises.exec) {
            this.promises.exec = new Promise((resolve, reject) => {
                const count = this.value('bindings');
                const previous = this.value('previous');
                if (count > 0) {
                    const module = this.parent;
                    const system = module.parent;
                    this.service.io.exec(system.id, module.id, module.index, this.id, this.value())
                        .then(() => {
                            this.promises.exec = null;
                            resolve();
                        }, (err) => {
                            this.promises.exec = null;
                            reject(err);
                        });
                } else {
                    this.promises.exec = null;
                }
            });
        } else {
            if (this.timers.exec) {
                clearTimeout(this.timers.exec);
                this.timers.exec = null;
            }
            this.timers.exec = setTimeout(() => this.exec(), EXEC_TIME_DELAY);
        }
        return this.promises.exec;
    }
}
