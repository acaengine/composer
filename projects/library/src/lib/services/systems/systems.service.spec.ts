import { SystemsService } from "./systems.service";
import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { ResourcesService } from '../resources/resources.service';
import { DataStoreService } from '../data-store.service';

describe('SystemsService', () => {
    let service: SystemsService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                SystemsService,
                { provide: ResourcesService, useValue: jasmine.createSpyObj('ResourcesService', ['setup']) },
                { provide: DataStoreService, useValue: jasmine.createSpyObj('DataStoreService', ['getItem', 'setItem', ]) }
            ],
            imports: [RouterModule]
        });
        service = TestBed.get(SystemsService);
    });
});
