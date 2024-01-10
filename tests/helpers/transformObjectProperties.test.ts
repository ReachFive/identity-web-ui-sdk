import { describe, expect, test } from '@jest/globals';

import { snakeCasePath, camelCasePath, transformObjectProperties } from '../../src/helpers/transformObjectProperties';

describe('transformObjectProperties', () => {

    test('should pass string value', () => {
        const result = transformObjectProperties('a', (str: string) => str.toUpperCase())
        expect(result).toEqual('a')
    })
    
    test('should pass number value', () => {
        const result = transformObjectProperties(42, (str: string) => str.toUpperCase())
        expect(result).toEqual(42)
    })
    
    test('should pass array of scalar values', () => {
        const result = transformObjectProperties(['aaa'], (str: string) => str.toUpperCase())
        expect(result).toEqual(['aaa'])
    })

    test('should transform record keys', () => {
        const result = transformObjectProperties({ aaa: 'bbb' }, (str: string) => str.toUpperCase())
        expect(result).toEqual({ AAA: 'bbb' })
    })

    test('should transform array of records', () => {
        const result = transformObjectProperties([{ aaa: 'bbb' }], (str: string) => str.toUpperCase())
        expect(result).toEqual([{ AAA: 'bbb' }])
    })

})

describe('snakeCasePath', () => {
    test('should rewrite string in snakeCase format', () => {
        const result = snakeCasePath('aaaBbb.cccDdd')
        expect(result).toBe('aaa_bbb.ccc_ddd')
    })
})

describe('camelCasePath', () => {
    test('should rewrite string in camelCase format', () => {
        const result = camelCasePath('aaa_bbb.ccc_ddd')
        expect(result).toBe('aaaBbb.cccDdd')
    })
})