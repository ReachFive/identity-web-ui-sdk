import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { LoginWithPasswordParams, LoginWithWebAuthnParams } from '@reachfive/identity-core';

import { specializeIdentifierData } from '../../src/helpers/utils';

import {
    camelCase,
    debounce,
    difference,
    find,
    intersection,
    isEmpty,
    isEqual,
    snakeCase,
} from '../../src/helpers/utils';

describe('utils', () => {
    /** @see https://lodash.com/docs/4.17.15#camelCase */
    describe('camelCase', () => {
        test('should transform string', () => {
            expect(camelCase('Foo 1 Bar 1')).toEqual('foo1Bar1');
            expect(camelCase('--foo-1-bar-1--')).toEqual('foo1Bar1');
            expect(camelCase('__FOO_1_BAR_1__')).toEqual('foo1Bar1');
            expect(camelCase('foo_bar')).toEqual('fooBar');
            expect(camelCase('fooBar')).toEqual('fooBar');
        });
    });

    /** @see https://lodash.com/docs/4.17.15#snakeCase */
    describe('snakeCase', () => {
        test('should transform string', () => {
            expect(snakeCase('Foo 1 Bar 1')).toEqual('foo_1_bar_1');
            expect(snakeCase('foo1Bar1')).toEqual('foo_1_bar_1');
            expect(snakeCase('--FOO-1-BAR-1--')).toEqual('foo_1_bar_1');
            expect(snakeCase('foo_bar')).toEqual('foo_bar');
            expect(snakeCase('fooBar')).toEqual('foo_bar');
        });
    });

    describe('isEmpty', () => {
        test('should test emptiness of a Null value', () => {
            expect(isEmpty(null)).toBe(true);
        });
        test('should test emptiness of a boolean', () => {
            expect(isEmpty(true)).toBe(true);
        });
        test('should test emptiness of a number', () => {
            expect(isEmpty(1)).toBe(true);
        });
        test('should test emptiness of an empty string', () => {
            expect(isEmpty('')).toBe(true);
        });
        test('should test emptiness of a non-empty string', () => {
            expect(isEmpty('a')).toBe(false);
        });
        test('should test emptiness of an array', () => {
            expect(isEmpty([1, 2, 3])).toBe(false);
            expect(isEmpty([])).toBe(true);
        });
        test('should test emptiness of an object', () => {
            expect(isEmpty({ a: 1 })).toBe(false);
            expect(isEmpty({})).toBe(true);
        });
    });

    describe('isEqual', () => {
        test('should compare equality between two collections', () => {
            expect(isEqual([], [])).toBe(true);
            expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
            expect(isEqual([1, 2, 3], [3, 2, 1])).toBe(true);
            expect(isEqual([1, 2, 3], [1, 2])).toBe(false);
            expect(isEqual([1], [1, 2])).toBe(false);
        });
    });

    describe('difference', () => {
        test('should extract difference between two collections', () => {
            const obtained = difference([2, 1], [2, 3]);
            const expected = [1];
            expect(obtained).toEqual(expected);
        });
    });

    describe('intersection', () => {
        test('should extract intersection between two collections', () => {
            const obtained = intersection([2, 1], [2, 3]);
            const expected = [2];
            expect(obtained).toEqual(expected);
        });
    });

    describe('find', () => {
        test('should find record item by predicate', () => {
            const obtained = find({ a: { id: 1 }, b: { id: 2 } }, item => item.id === 2);
            const expected = { id: 2 };
            expect(obtained).toEqual(expected);
        });
    });

    describe('debounce', () => {
        jest.useFakeTimers();

        let func: jest.Mock;

        beforeEach(() => {
            func = jest.fn();
        });

        test('leading = false', () => {
            const debouncedFunc = debounce(func, 1000, { leading: false });

            for (let i = 0; i < 100; i++) {
                debouncedFunc();
            }

            // Fast-forward time
            jest.runAllTimers();

            expect(func).toBeCalledTimes(1);
        });

        test('leading = true', () => {
            const debouncedFunc = debounce(func, 1000, { leading: true });

            for (let i = 0; i < 100; i++) {
                debouncedFunc();
            }

            // Fast-forward time
            jest.runAllTimers();

            expect(func).toBeCalledTimes(2);
        });
    });

    describe('specializeIdentifierData', () => {
        describe('EmailLoginWithPasswordParams', () => {
            describe('with Email', () => {
                test('as email property', () => {
                    const obtained = specializeIdentifierData<LoginWithPasswordParams>({
                        email: 'bob@mail.com',
                        password: 'secretpassword',
                        captchaToken: 'azerty12345',
                    });
                    const expected = {
                        email: 'bob@mail.com',
                        password: 'secretpassword',
                        captchaToken: 'azerty12345',
                    };
                    expect(obtained).toEqual(expected);
                });

                test('as identifier property', () => {
                    const obtained = specializeIdentifierData<LoginWithPasswordParams>({
                        identifier: 'bob@mail.com',
                        password: 'secretpassword',
                        captchaToken: 'azerty12345',
                    });
                    const expected = {
                        email: 'bob@mail.com',
                        password: 'secretpassword',
                        captchaToken: 'azerty12345',
                    };
                    expect(obtained).toEqual(expected);
                });
            });

            describe('with PhoneNumber', () => {
                test('as phoneNumber param', () => {
                    const obtained = specializeIdentifierData<LoginWithPasswordParams>({
                        phoneNumber: '+33123456789',
                        password: 'secretpassword',
                        captchaToken: 'azerty12345',
                    });
                    const expected = {
                        phoneNumber: '+33123456789',
                        password: 'secretpassword',
                        captchaToken: 'azerty12345',
                    };
                    expect(obtained).toEqual(expected);
                });

                test('as identifier param', () => {
                    const obtained = specializeIdentifierData<LoginWithPasswordParams>({
                        identifier: '+33123456789',
                        password: 'secretpassword',
                        captchaToken: 'azerty12345',
                    });
                    const expected = {
                        phoneNumber: '+33123456789',
                        password: 'secretpassword',
                        captchaToken: 'azerty12345',
                    };
                    expect(obtained).toEqual(expected);
                });
            });

            describe('with CustomIdentifier', () => {
                test('as customIdentifier param', () => {
                    const obtained = specializeIdentifierData<LoginWithPasswordParams>({
                        customIdentifier: 'bob971',
                        password: 'secretpassword',
                        captchaToken: 'azerty12345',
                    });
                    const expected = {
                        customIdentifier: 'bob971',
                        password: 'secretpassword',
                        captchaToken: 'azerty12345',
                    };
                    expect(obtained).toEqual(expected);
                });

                test('as identifier param', () => {
                    const obtained = specializeIdentifierData<LoginWithPasswordParams>({
                        identifier: 'bob971',
                        password: 'secretpassword',
                        captchaToken: 'azerty12345',
                    });
                    const expected = {
                        customIdentifier: 'bob971',
                        password: 'secretpassword',
                        captchaToken: 'azerty12345',
                    };
                    expect(obtained).toEqual(expected);
                });
            });
        });

        describe('LoginWithWebAuthnParams', () => {
            describe('with Email', () => {
                test('as email property', () => {
                    const obtained: LoginWithWebAuthnParams =
                        specializeIdentifierData<LoginWithWebAuthnParams>({
                            email: 'bob@mail.com',
                            auth: {
                                redirectUri: 'http://localhost',
                            },
                        });
                    const expected = {
                        email: 'bob@mail.com',
                        auth: {
                            redirectUri: 'http://localhost',
                        },
                    };
                    expect(obtained).toEqual(expected);
                });

                test('as identifier property', () => {
                    const obtained = specializeIdentifierData<LoginWithWebAuthnParams>({
                        identifier: 'bob@mail.com',
                        auth: {
                            redirectUri: 'http://localhost',
                        },
                    });
                    const expected = {
                        email: 'bob@mail.com',
                        auth: {
                            redirectUri: 'http://localhost',
                        },
                    };
                    expect(obtained).toEqual(expected);
                });
            });

            describe('with PhoneNumber', () => {
                test('as phoneNumber param', () => {
                    const obtained = specializeIdentifierData<LoginWithWebAuthnParams>({
                        phoneNumber: '+33123456789',
                        auth: {
                            redirectUri: 'http://localhost',
                        },
                    });
                    const expected = {
                        phoneNumber: '+33123456789',
                        auth: {
                            redirectUri: 'http://localhost',
                        },
                    };
                    expect(obtained).toEqual(expected);
                });

                test('as identifier param', () => {
                    const obtained = specializeIdentifierData<LoginWithWebAuthnParams>({
                        identifier: '+33123456789',
                        auth: {
                            redirectUri: 'http://localhost',
                        },
                    });
                    const expected = {
                        phoneNumber: '+33123456789',
                        auth: {
                            redirectUri: 'http://localhost',
                        },
                    };
                    expect(obtained).toEqual(expected);
                });
            });
        });
    });
});
