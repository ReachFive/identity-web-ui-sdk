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
