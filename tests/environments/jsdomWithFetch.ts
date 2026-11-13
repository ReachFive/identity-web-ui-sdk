import type { EnvironmentContext, JestEnvironmentConfig } from '@jest/environment';
import { TestEnvironment } from 'jest-environment-jsdom';

/**
 * jsdom with the Fetch API classes of Node. jsdom has none, and `@reachfive/identity-core` no
 * longer bundles a polyfill since 1.43.0: a test that answers the core client's requests builds
 * real `Response` objects. `fetch` itself stays out, for the test to mock.
 */
export default class JsdomWithFetchEnvironment extends TestEnvironment {
    constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
        super(config, context);
        Object.assign(this.global, { Headers, Request, Response });
    }
}
