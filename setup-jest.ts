/* eslint-disable simple-import-sort/imports */
/* eslint-disable import/order */
/* eslint-disable import/first */

// Polyfill TextEncoder, TextDecoder, and TransformStream for jsdom environment
// CRITICAL: These must be imported and assigned to global BEFORE importing nock
// because nock uses them immediately during its import

// Step 1: Import polyfills
import { TextDecoder, TextEncoder } from 'util';
import { TransformStream } from 'stream/web';

// Step 2: Assign to global (MUST happen before nock import)
global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;
global.TransformStream = TransformStream as typeof global.TransformStream;

// Step 3: Polyfill fetch globals (also needed before nock import)
if (typeof global.Response === 'undefined') {
    // @ts-expect-error - Mocking Response for tests
    global.Response = class Response {
        constructor(
            public body: any,
            public init?: any
        ) {}
        json() {
            return Promise.resolve(this.body);
        }
    };
}

if (typeof global.Request === 'undefined') {
    // @ts-expect-error - Mocking Request for tests
    global.Request = class Request {
        constructor(
            public url: string,
            public init?: any
        ) {}
    };
}

if (typeof global.Headers === 'undefined') {
    // @ts-expect-error - Mocking Headers for tests
    global.Headers = class Headers {
        private headers: Record<string, string> = {};
        set(key: string, value: string) {
            this.headers[key] = value;
        }
        get(key: string) {
            return this.headers[key];
        }
    };
}

// Step 4: NOW it's safe to import nock and other modules
import { afterAll, afterEach, beforeAll } from '@jest/globals';
import nock from 'nock';

beforeAll(() => {
    nock.disableNetConnect();
});

afterEach(() => {
    nock.cleanAll();
});

afterAll(() => {
    nock.enableNetConnect();
});
