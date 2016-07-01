
import '../polyfill';
import { inject } from '@angular/core/testing';
import { SystemsService } from './systems-service';

function sleep(milliseconds) {
  let start = new Date().getTime();
  for (let i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

describe('System Service Class:', () => {
    let service;

    beforeEach(() => {
        service = new SystemsService();
    });
/*
    it('Should get System sys-B0', () => {
        let system = service.get('sys-B0');
        expect(system).toBeDefined();
    });

    it('Get Display 1 from sys-B0', () => {
        let system = service.get('sys-B0');
        expect(system.id).toBe('sys-B0');
        let module = system.get('Display');
        expect(module.id).toBe('Display');
        expect(module.index).toBe(1);
    });

    it('Update power of Display 1', () => {
        let system = service.get('sys-B0');
        let module = system.get('Display');
        module.bind('power', (current, previous) => {
            console.log('=== Change Callback ===');
            console.log(current, previous);
        });
        let val = module.get('power');
        expect(val.current).toBe(0);
        module.exec('$power', 'power', true);
        sleep(200);
        console.log(val);
        console.log('Value: ' + val.current);
        expect(val.current).toBe(true);
        module.exec('$power', 'power', false);
        sleep(200);
        console.log('Value: ' + val.current);
        expect(val.current).toBe(false);
        module.unbind('power');
    });

    it('Check binding of power property of Display 1', () => {
        let system = service.get('sys-B0');
        let module = system.get('Display');
        module.bind('power');
        let val = module.get('power');
        console.log(val);
        expect(val.bindings).toBe(1);
        let unbind = module.bind('power');
        expect(val.bindings).toBe(2);
        unbind();
        expect(val.bindings).toBe(1);
        module.bind('power');
        module.unbind('power');
        expect(val.bindings).toBe(0);
    });
//*/
});
