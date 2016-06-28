/// <reference path="../../typings/main.d.ts" />
import {it, describe, expect, beforeEach, inject} from 'angular2/testing';
import { SystemsService } from './systems-service';

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

describe('System Service Class:', () => {
    let service: SystemsService = new SystemsService();

    it('Should get System sys-B0', () => {
        let system = service.get('sys-B0');
        expect(system);
    });

    it('Get Display 1 from sys-B0', () => {
        var system = service.get('sys-B0');
        expect(system.id).toBe('sys-B0');
        var module = system.get('Display');
        expect(module.id).toBe('Display');
        expect(module.index).toBe(1);
    });

    it('Update power of Display 1', () => {
        var system = service.get('sys-B0');
        var module = system.get('Display');
        module.bind('power');
        var val = module.get('power');
        expect(val.current).toBe(0);
        module.exec('$power', 'power', true);
        sleep(200);
        console.log('Value: ' + val.current);
        expect(val.current).toBe(true);
        module.exec('$power', 'power', false);
        sleep(200);
        console.log('Value: ' + val.current);
        expect(val.current).toBe(false);
        module.unbind('power');
    });

    it('Check binding of power property of Display 1', () => {
        var system = service.get('sys-B0');
        var module = system.get('Display');
        module.bind('power');
        var val = module.get('power');
        expect(val.bindings).toBe(1);
        module.bind('power');
        expect(val.bindings).toBe(2);
        module.unbind('power');
        expect(val.bindings).toBe(1);
    });
});
