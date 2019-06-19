import { SystemsService } from "./systems.service";
import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { ResourcesService } from '../resources/resources.service';
import { DataStoreService } from '../data-store.service';

describe('SystemsService', () => {
    let service: SystemsService;
    let store: any;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                SystemsService,
                { provide: ResourcesService, useValue: jasmine.createSpyObj('ResourcesService', ['setup']) },
                { provide: DataStoreService, useValue: jasmine.createSpyObj('DataStoreService', ['getItem', 'setItem', ]) }
            ],
            imports: [RouterModule.forRoot([])]
        });
        store = TestBed.get(DataStoreService);
        store.local = jasmine.createSpyObj('WorkerStorage', ['getItem', 'setItem',]);
        store.local.getItem.and.returnValue(Promise.resolve(''));
        service = TestBed.get(SystemsService);
    });

    it('should create an instance', () => {
        expect(service).toBeTruthy();
        expect(service instanceof SystemsService).toBeTruthy();
    })
});
