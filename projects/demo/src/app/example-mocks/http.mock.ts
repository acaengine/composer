
import { MockHttpRequestHandlerOptions, generateMockSystem } from '@acaprojects/ts-composer';

const MOCK_SYSTEMS = Array(Math.floor(Math.random() * 100 + 5)).fill(0).map(i => generateMockSystem());

const handlers: MockHttpRequestHandlerOptions[] = [
    {
        path: '/api/engine/v1/systems',
        metadata: {},
        method: 'GET',
        callback: (request) => MOCK_SYSTEMS
    }
]

window.control.handlers = handlers;
