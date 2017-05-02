/*
* @Author: Alex Sorafumo
* @Date:   2017-05-01 15:18:31
* @Last Modified by:   Alex Sorafumo
* @Last Modified time: 2017-05-01 15:27:47
*/

import * as faker from 'faker';

import { MockClass } from './class.mock';

export class MockUser extends MockClass {
    public name: string;
    public email: string;
    constructor() {
        super();
        const gender = Math.floor(Math.random() * 100000) % 2;
        this.name = faker.name.firstName(gender) + ' ' + faker.name.lastName(gender);
        this.email = this.name.split(' ').join('.').toLowerCase() + '@' + faker.internet.domainName();
    }
}
