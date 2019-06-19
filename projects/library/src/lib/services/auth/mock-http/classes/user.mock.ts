/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-01 15:18:31
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-02 11:13:59
 */

import { MockClass } from './class.mock';

const NAMES: any = {
    FIRST: ['Alex', 'Norbert', 'Jim', 'Bob', 'Ben', 'Steve', 'William', 'John', 'Steph', 'Amy', 'Rose', 'Julia', 'Bruce'],
    LAST: ['Sorafumo', 'Hoad', 'Smith', 'Suzuki', 'Boseley', 'Burgess', 'Whiteford', 'Le', 'Reeves', 'Lee']
}

export class MockUser extends MockClass {
    public name: string;
    public email: string;
    constructor() {
        super();
        const gender = Math.floor(Math.random() * 100000) % 2;
        this.name = `${NAMES.FIRST[Math.floor(Math.random() * NAMES.FIRST.length)]} ${NAMES.LAST[Math.floor(Math.random() * NAMES.LAST.length)]}`;
        this.email = this.name.split(' ').join('.').toLowerCase() + '@aca.im';
    }
}
