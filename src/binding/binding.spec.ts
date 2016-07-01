
import '../polyfill';
import { Component, Compiler } from '@angular/core';
import { addProviders, inject, async, TestComponentBuilder } from '@angular/core/testing';

import { Binding } from './binding.dir.ts';
import { SystemsService } from '../systems-service';

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

@Component({
    selector: 'container',
    template: `
        <div binding [bind]="bound" [sys]="system" [mod]="module" [value]="value" (change)="change($event)"></div>
    `,
    directives: [Binding]
})
export class Container {
    value: any = false;
    bound: string = 'power';
    system: string = 'sys-B0';
    module: string = 'Display';
    constructor(){

    }

    change(e){
        this.value = e;
        console.log(this.value);
    }
}

describe('Directive: Binding', () => {
    let fixture;
//*
    //setup
    beforeEach(() => {
        addProviders([ TestComponentBuilder ]);
    });
//*/
    //specs
    it('should activate exec on binding', async(inject([TestComponentBuilder], tcb => {
        console.log(tcb);
        return tcb
        .createAsync(Container)
        .then((f) => {
            fixture = f;
            console.log('Constructed.');
        });
    })));
});

/*
done => {
    let cntr;
    console.log(fixture);
    sleep(1000);
    //set up subscriber
    done();
}
//*/
