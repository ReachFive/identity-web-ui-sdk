import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import { camelCase, debounce, difference, find, intersection, isEqual, isEmpty, snakeCase } from '../../src/helpers/utils';

describe('utils', () => {

    test('camelCase', () => {
        expect(camelCase('Foo Bar')).toEqual('fooBar')
        expect(camelCase('--foo-bar--')).toEqual('fooBar')
        expect(camelCase('__FOO_BAR__')).toEqual('fooBar')
    })

    test('snakeCase', () => {
        expect(snakeCase('Foo Bar')).toEqual('foo_bar')
        expect(snakeCase('fooBar')).toEqual('foo_bar')
        expect(snakeCase('--FOO-BAR--')).toEqual('foo_bar')
    })

    test('isEmpty', () => {
        expect(isEmpty(null)).toBe(true)
        expect(isEmpty(true)).toBe(true)
        expect(isEmpty(1)).toBe(true)
        expect(isEmpty('')).toBe(true)
        expect(isEmpty('a')).toBe(false)
        expect(isEmpty([1, 2, 3])).toBe(false)
        expect(isEmpty({ 'a': 1 })).toBe(false)
    })

    test('isEqual', () => {
        expect(isEqual([], [])).toBe(true)
        expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true)
        expect(isEqual([1, 2, 3], [3, 2, 1])).toBe(true)
        expect(isEqual([1, 2, 3], [1, 2])).toBe(false)
        expect(isEqual([1], [1, 2])).toBe(false)
    })

    test('difference', () => {
        const obtained = difference([2, 1], [2, 3])
        const expected = [1]
        expect(obtained).toEqual(expected)
    })

    test('intersection', () => {
        const obtained = intersection([2, 1], [2, 3])
        const expected = [2]
        expect(obtained).toEqual(expected)
    })

    test('find', () => {
        const obtained = find({ 'a': { id: 1 }, 'b': { id: 2 } }, item => item.id === 2)
        const expected = { id: 2 }
        expect(obtained).toEqual(expected)
    })

    describe('debounce', () => {
        jest.useFakeTimers();

        let func: jest.Mock;

        beforeEach(() => {
            func = jest.fn();
        })

        test('leading = false', () => {
            const debouncedFunc = debounce(func, 1000, { leading: false });
    
            for (let i = 0; i < 100; i++) {
                debouncedFunc();
            }
    
            // Fast-forward time
            jest.runAllTimers();
    
            expect(func).toBeCalledTimes(1);
        })

        test('leading = true', () => {
    
            const debouncedFunc = debounce(func, 1000, { leading: true });
    
            for (let i = 0; i < 100; i++) {
                debouncedFunc();
            }
    
            // Fast-forward time
            jest.runAllTimers();
    
            expect(func).toBeCalledTimes(2);
        })
    })

})