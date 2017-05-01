/*
 * @Author: Alex Sorafumo
 * @Date:   2017-03-31 12:51:02
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-01 09:29:08
 */

import { TestBed, inject, async } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement }    from '@angular/core';

import { DataStoreService } from '../../../_build';
import { ACA_COMPOSER_MODULE } from '../../../_build';

describe('DataStore Service', () => {
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

  	it('local storage item "test" to be null', (done) => { 
   		service.local.getItem('test').then((item: string) => {
   			expect(item).toBe(null);
   			done();
   		});
  	});

  	it('local storage item "test" to be "test"', (done) => {
		service.local.setItem('test', 'test').then((item: string) => {
	   		service.local.getItem('test').then((item: string) => {
	   			expect(item).toBe('test');
	   			done();
	   		});
   		});
  	});

  	it('local storage item "test" to be null after "test2" is set to "test"', (done) => {
   		service.local.setItem('test2', 'test').then((i: string) => {
	   		service.local.getItem('test').then((item: string) => {
	   			expect(item).not.toBe('test');
	   			done();
	   		});
   		});
  	});

  	it('session storage item "test" to be null', (done) => {
   		service.session.getItem('test').then((item: string) => {
   			expect(item).toBe(null);
   			done();
   		});
  	});

  	it('sessions storage item "test" to be "test"', (done) => {
   		service.session.setItem('test', 'test').then((item: string) => {
	   		service.session.getItem('test').then((item: string) => {
	   			expect(item).toBe('test');
	   			done();
	   		});
   		});
  	});

  	it('sessions storage item "test" to be null after "test2" is set to "test"', (done) => {
   		service.session.setItem('test2', 'test').then((i: string) => {
	   		service.local.getItem('test').then((item: string) => {
	   			expect(item).not.toBe('test');
	   			done();
	   		});
   		});
  	});
});
