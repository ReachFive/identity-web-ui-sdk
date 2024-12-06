import { BaseOptions } from './simpleField'
import type { FieldCreator } from '../fieldCreator'

export interface Options<T> extends BaseOptions<T> {
    path: string
    type: 'opt-in',
    extendedParams: {
        version: {
            versionId: number
            language: string
        },
        description: string
        consentCannotBeGranted: boolean
    }
} 

export default function consentField<T>(options: Options<T>): FieldCreator
