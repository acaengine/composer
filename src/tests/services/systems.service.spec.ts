/*
 * @Author: Alex Sorafumo
 * @Date:   2017-04-03 09:55:09
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-01 10:39:09
 */

import { TestBed, inject, async } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement }    from '@angular/core';

import { DataStoreService } from '../../../_build';
import { ACA_COMPOSER_MODULE } from '../../../_build';

describe("Systems Service", () => {
    let service: DataStoreService = null;

    beforeEach( async(() => {
        localStorage.clear();
        sessionStorage.clear();
        TestBed.configureTestingModule({
            providers: [ DataStoreService ]
        })
        .compileComponents().then(inject([DataStoreService], (d_store: DataStoreService) => {
            service = d_store;
        }));    
    }));
});
