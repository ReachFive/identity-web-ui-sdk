import { describe, expect, test } from '@jest/globals';

import { getValue, setValue } from '../../src/helpers/propertyHelpers';

describe('propertyHelpers', () => {
    describe('getValue', () => {
        test('should return object if key not found', () => {
            const object = { a: 'b' };
            const result = getValue(object, 'unknown');
            expect(result).toBeUndefined();
        });

        test('should get value by key', () => {
            const object = { a: 'b' };
            const result = getValue(object, 'a');
            expect(result).toEqual('b');
        });

        test('should get value by path', () => {
            const object = { a: { b: { c: 'd' } } };
            const result = getValue(object, 'a.b.c');
            expect(result).toEqual('d');
        });
    });

    describe('setValue', () => {
        test('should set a new value', () => {
            const object = {};
            const result = setValue(object, 'a', 'b');
            expect(result).toEqual({ a: 'b' });
        });

        test('should errase an existing value by key', () => {
            const object = { a: 'a' };
            const result = setValue(object, 'a', 'b');
            expect(result).toEqual({ a: 'b' });
        });

        test('should set a new value by path', () => {
            const object = {};
            const result = setValue(object, 'a.b.c', 'd');
            expect(result).toEqual({ a: { b: { c: 'd' } } });
        });

        test('should set erase an existing value by path', () => {
            const object = { a: { b: { c: 'd' } } };
            const result = setValue(object, 'a.b.c', 'e');
            expect(result).toEqual({ a: { b: { c: 'e' } } });
        });

        test('should set new value by path (empty object)', () => {
            expect(setValue({}, 'a', 2)).toEqual({ a: 2 });
        });
        test('should override an existing value by path', () => {
            expect(setValue({ a: 1 }, 'a', 2)).toEqual({ a: 2 });
        });
        test('should set a new value by path', () => {
            expect(setValue({ a: 1 }, 'b', 2)).toEqual({ a: 1, b: 2 });
        });
        test('should set nested new value by path', () => {
            expect(setValue({ a: 1 }, 'b.c', 2)).toEqual({ a: 1, b: { c: 2 } });
        });
        test('should override nested value by path', () => {
            expect(setValue({ a: { b: { c: 1 } } }, 'a.b.c', 2)).toEqual({ a: { b: { c: 2 } } });
        });
        test('should add nested value by path', () => {
            expect(setValue({ a: { b: { c: 1 } } }, 'a.b.d', 2)).toEqual({
                a: { b: { c: 1, d: 2 } },
            });
        });
        test('should set new array value by path', () => {
            expect(setValue({ a: 1 }, 'b.0.c', 2)).toEqual({ a: 1, b: [{ c: 2 }] });
        });
        test('should override array value by path', () => {
            expect(setValue({ a: 1, b: [{ c: 1 }] }, 'b.0.c', 2)).toEqual({
                a: 1,
                b: [{ c: 2 }],
            });
        });
        test('should update array value by path', () => {
            expect(setValue({ a: 1, b: [{ c: 1 }] }, 'b.0.d', 2)).toEqual({
                a: 1,
                b: [{ c: 1, d: 2 }],
            });
        });
        test('should add vaule to array by path', () => {
            expect(setValue({ a: 1, b: [{ c: 1 }] }, 'b.1.d', 2)).toEqual({
                a: 1,
                b: [{ c: 1 }, { d: 2 }],
            });
        });
    });
});
