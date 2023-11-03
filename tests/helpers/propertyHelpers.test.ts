import { describe, expect, test } from '@jest/globals';

import { getValue, setValue } from '../../src/helpers/propertyHelpers';

describe('propertyHelpers', () => {

    describe('getValue', () => {

        test('should return object if key not found', () => {
            const object = { a: 'b' } 
            const result = getValue(object, 'unknown')
            expect(result).toBeUndefined()
        })

        test('should get value by key', () => {
            const object = { a: 'b' } 
            const result = getValue(object, 'a')
            expect(result).toEqual('b')
        })

        test('should get value by path', () => {
            const object = { a: { b: { c: 'd' }}} 
            const result = getValue(object, 'a.b.c')
            expect(result).toEqual('d')
        })

    })

    describe('setValue', () => {

        test('should set a new value', () => {
            const object = {} 
            const result = setValue(object, 'a', 'b')
            expect(result).toEqual({ a: 'b' })
        })

        test('should errase an existing value by key', () => {
            const object = { a: 'a' } 
            const result = setValue(object, 'a', 'b')
            expect(result).toEqual({ a: 'b' })
        })

        test('should set a new value by path', () => {
            const object = {} 
            const result = setValue(object, 'a.b.c', 'd')
            expect(result).toEqual({ a: { b: { c: 'd' }}})
        })

        test('should set erase an existing value by path', () => {
            const object = { a: { b: { c: 'd' }}} 
            const result = setValue(object, 'a.b.c', 'e')
            expect(result).toEqual({ a: { b: { c: 'e' }}})
        })

    })

})